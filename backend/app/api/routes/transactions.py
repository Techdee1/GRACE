from fastapi import APIRouter, Depends, HTTPException, status
from redis.exceptions import RedisError
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.transactions import IngestAcceptedResponse, TransactionIngestBatchRequest, TransactionIngestItem
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
