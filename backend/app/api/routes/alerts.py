from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models import Alert, AlertStatus
from app.schemas.alerts import AlertDetailResponse, AlertListItemResponse, AlertsListResponse


router = APIRouter()


@router.get("/alerts", response_model=AlertsListResponse)
def list_alerts(
    limit: int = Query(default=50, ge=1, le=500),
    status_filter: AlertStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> AlertsListResponse:
    query = select(Alert)
    if status_filter is not None:
        query = query.where(Alert.status == status_filter)

    rows = db.scalars(query.order_by(desc(Alert.created_at)).limit(limit)).all()
    items = [
        AlertListItemResponse(
            id=row.id,
            pattern_type=row.pattern_type.value,
            risk_score=row.risk_score,
            reason=row.reason,
            status=row.status.value,
            entity_ids=[str(x) for x in row.entity_ids],
            transaction_ids=[str(x) for x in row.transaction_ids],
            created_at=row.created_at,
        )
        for row in rows
    ]
    return AlertsListResponse(alerts=items, total=len(items))


@router.get("/alerts/{alert_id}", response_model=AlertDetailResponse)
def get_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
) -> AlertDetailResponse:
    row = db.get(Alert, alert_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    return AlertDetailResponse(
        id=row.id,
        pattern_type=row.pattern_type.value,
        risk_score=row.risk_score,
        reason=row.reason,
        status=row.status.value,
        entity_ids=[str(x) for x in row.entity_ids],
        transaction_ids=[str(x) for x in row.transaction_ids],
        subgraph_json=row.subgraph_json,
        created_at=row.created_at,
    )
