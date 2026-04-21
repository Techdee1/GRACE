from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from redis.exceptions import RedisError
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import IngestJob
from app.schemas.transactions import (
    IngestAcceptedResponse,
    IngestJobStatusResponse,
    TransactionIngestBatchRequest,
    TransactionIngestItem,
)
from app.services.ingest_service import create_ingest_job


router = APIRouter()


@router.post(
    "/transactions/ingest",
    response_model=IngestAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def ingest_transactions(
    payload: TransactionIngestItem | TransactionIngestBatchRequest,
    db: Session = Depends(get_db),
) -> IngestAcceptedResponse:
    try:
        return create_ingest_job(db=db, payload=payload)
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingest queue is currently unavailable",
        ) from exc


@router.get("/jobs/{job_id}", response_model=IngestJobStatusResponse)
def get_job_status(
    job_id: UUID,
    db: Session = Depends(get_db),
) -> IngestJobStatusResponse:
    job = db.get(IngestJob, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return IngestJobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        total_records=job.total_records,
        processed_records=job.processed_records,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )
