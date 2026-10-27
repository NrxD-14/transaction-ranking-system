"""Summary API route: GET /summary/{userId} — stats and score breakdown."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account
from app.models import Account
from app.schemas.summary import UserSummary
from app.services.summary_service import get_user_summary

router = APIRouter(tags=["Summary"])


@router.get("/summary/{userId}", response_model=UserSummary)
def get_summary(userId: str, _: Account = Depends(get_current_account), db: Session = Depends(get_db)):
    return get_user_summary(db, userId)
