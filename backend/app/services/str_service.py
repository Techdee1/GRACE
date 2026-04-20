from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Alert, STRDraft
from app.schemas.str_drafts import STRDraftResponse
from app.services.str_generation_service import STRGenerationError, str_generation_service


def _to_response(row: STRDraft) -> STRDraftResponse:
    return STRDraftResponse(
        id=row.id,
        alert_id=row.alert_id,
        reviewer_notes=row.reviewer_notes,
        provider=row.provider,
        model_name=row.model_name,
        model_version=row.model_version,
        decision=row.decision.value,
        content_json=row.content_json,
        content_text=row.content_text,
        created_at=row.created_at,
    )


def generate_str_draft(db: Session, alert_id: UUID, reviewer_notes: str | None) -> STRDraftResponse:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise ValueError("Alert not found")

    alert_payload = {
        "alert_id": str(alert.id),
        "pattern_type": alert.pattern_type.value,
        "risk_score": str(alert.risk_score),
        "reason": alert.reason,
        "entity_ids": [str(x) for x in alert.entity_ids],
        "transaction_ids": [str(x) for x in alert.transaction_ids],
        "subgraph_json": alert.subgraph_json,
        "time_period": alert.subgraph_json.get("window_hours", "not_specified"),
    }

    result = str_generation_service.generate(alert_payload=alert_payload, reviewer_notes=reviewer_notes)

    row = STRDraft(
        alert_id=alert.id,
        reviewer_notes=reviewer_notes,
        provider=result.provider,
        model_name=result.model_name,
        model_version=result.model_version,
        content_json=result.content_json,
        content_text=result.content_text,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


def get_str_draft(db: Session, str_id: UUID) -> STRDraftResponse | None:
    row = db.get(STRDraft, str_id)
    if row is None:
        return None
    return _to_response(row)


__all__ = ["STRGenerationError", "generate_str_draft", "get_str_draft"]
