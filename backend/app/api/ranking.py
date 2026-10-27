"""Ranking API route: GET /ranking — returns users sorted by composite score."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account
from app.models import Account
from app.schemas.ranking import RankingResponse
from app.services.ranking_service import build_ranking

router = APIRouter(tags=["Ranking"])


@router.get("/ranking", response_model=RankingResponse)
def get_ranking(_: Account = Depends(get_current_account), db: Session = Depends(get_db)):
    users = build_ranking(db)
    return RankingResponse(users=users)
