"""Data API routes: GET /users and GET /transactions for frontend dashboard."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account
from app.models import Account, Transaction
from app.schemas.transaction import TransactionResponse
from app.services.ranking_service import build_ranking

router = APIRouter(tags=["Data"])


@router.get("/users")
def get_users(_: Account = Depends(get_current_account), db: Session = Depends(get_db)):
    return {"users": build_ranking(db)}


@router.get("/transactions")
def get_transactions(_: Account = Depends(get_current_account), db: Session = Depends(get_db)):
    rows = db.query(Transaction).order_by(Transaction.id.desc()).all()
    payload = [
        TransactionResponse(
            id=tx.transaction_id,
            userId=tx.user_id,
            userName=tx.user.name,
            userAvatar=tx.user.avatar,
            amount=tx.amount,
            type=tx.type,
            date=tx.date,
            status=tx.status,
            score=tx.score,
            description=tx.description,
        )
        for tx in rows
    ]
    return {"transactions": payload}
