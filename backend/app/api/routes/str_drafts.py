from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.str_drafts import STRDraftResponse, STRGenerateRequest
from app.services.str_service import STRGenerationError, generate_str_draft, get_str_draft


router = APIRouter()


@router.post("/str/generate", response_model=STRDraftResponse, status_code=status.HTTP_201_CREATED)
def generate_str(
    payload: STRGenerateRequest,
    db: Session = Depends(get_db),
) -> STRDraftResponse:
    try:
        return generate_str_draft(db=db, alert_id=payload.alert_id, reviewer_notes=payload.reviewer_notes)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except STRGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/str/{str_id}", response_model=STRDraftResponse)
def fetch_str(
    str_id: UUID,
    db: Session = Depends(get_db),
) -> STRDraftResponse:
    row = get_str_draft(db=db, str_id=str_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="STR draft not found")
    return row
