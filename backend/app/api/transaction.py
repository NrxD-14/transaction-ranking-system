"""Transaction API route: POST /transaction."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account
from app.models import Account
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.log_service import record_log
from app.services.transaction_service import create_transaction

router = APIRouter(tags=["Transactions"])


@router.post("/transaction", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction_endpoint(
    payload: TransactionCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    tx = create_transaction(db, payload)
    record_log(
        db,
        category="transaction",
        message=f"{tx.type.title()} transaction {tx.transaction_id} recorded for ${tx.amount:,.2f}",
        user_email=account.email,
        metadata={"transactionId": tx.transaction_id, "userId": tx.user_id},
    )
    return TransactionResponse(
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
