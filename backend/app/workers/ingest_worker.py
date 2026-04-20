from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.redis_client import redis_client
from app.models import IngestJob, JobStatus, Transaction


REDIS_INGEST_QUEUE_KEY = "ingest:jobs:queue"
REDIS_INGEST_TTL_SECONDS = 24 * 60 * 60


def _load_payload(job_id: str) -> dict:
    payload_key = f"ingest:job:{job_id}:payload"
    payload_raw = redis_client.get(payload_key)
    if not payload_raw:
        raise ValueError(f"Missing payload in Redis for job_id={job_id}")
    return json.loads(payload_raw)


def _upsert_transaction_record(db_session, record: dict) -> Transaction:
    existing = db_session.scalar(select(Transaction).where(Transaction.reference == record["reference"]))
    if existing is not None:
        return existing

    tx = Transaction(
        source_entity_id=uuid.UUID(record["source_entity_id"]),
        destination_entity_id=uuid.UUID(record["destination_entity_id"]),
        amount=Decimal(record["amount"]),
        currency=record["currency"],
        occurred_at=datetime.fromisoformat(record["occurred_at"]),
        reference=record["reference"],
        channel=record.get("channel"),
        metadata_json=record.get("metadata_json") or {},
    )
    db_session.add(tx)
    db_session.flush()
    return tx


def process_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.get(IngestJob, uuid.UUID(job_id))
        if job is None:
            return

        job.status = JobStatus.processing
        job.error_message = None
        db.commit()

        payload = _load_payload(job_id)
        records = payload.get("records", [])

        processed_count = 0
        for record in records:
            _upsert_transaction_record(db, record)
            processed_count += 1
            job.processed_records = processed_count

        job.status = JobStatus.completed
        job.processed_records = processed_count
        db.commit()

        payload_key = f"ingest:job:{job_id}:payload"
        redis_client.expire(payload_key, REDIS_INGEST_TTL_SECONDS)
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        try:
            failed_job = db.get(IngestJob, uuid.UUID(job_id))
            if failed_job is not None:
                failed_job.status = JobStatus.failed
                failed_job.error_message = str(exc)[:500]
                db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
        raise
    finally:
        db.close()


def run_worker_loop() -> None:
    poll_timeout_seconds = int(os.getenv("INGEST_WORKER_POLL_TIMEOUT", "5"))
    print("[ingest-worker] starting loop")

    while True:
        queued_item = redis_client.blpop(REDIS_INGEST_QUEUE_KEY, timeout=poll_timeout_seconds)
        if queued_item is None:
            continue

        _, job_id = queued_item
        try:
            process_job(job_id)
            print(f"[ingest-worker] processed job_id={job_id}")
        except Exception as exc:  # noqa: BLE001
            print(f"[ingest-worker] failed job_id={job_id}: {exc}")
            time.sleep(1)


if __name__ == "__main__":
    run_worker_loop()
