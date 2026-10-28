"""Transaction creation with validation and duplicate-ID prevention via DB unique constraint."""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Account, Transaction, User
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def create_transaction(db: Session, payload: TransactionCreate) -> Transaction:
    user = db.query(User).filter(User.id == payload.userId).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{payload.userId}' not found",
        )

    payload_date = payload.date if payload.date.tzinfo else payload.date.replace(tzinfo=timezone.utc)
    if payload_date > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction date cannot be in the future",
        )

    score = min(int(payload.amount / 50), 1000)
    entity = Transaction(
        transaction_id=payload.transactionId,
        user_id=payload.userId,
        amount=payload.amount,
        type=payload.type,
        date=payload.date,
        status=payload.status,
        score=score,
        description=payload.description or "Manual transaction entry",
    )

    db.add(entity)
    try:
        db.commit()
    except IntegrityError:
        # UNIQUE constraint on transaction_id — duplicate business IDs return 409
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transaction '{payload.transactionId}' already exists",
        ) from None
    db.refresh(entity)
    return entity


def update_transaction(
    db: Session,
    transaction_id: str,
    payload: TransactionUpdate,
    account: Account,
) -> Transaction:
    entity = (
        db.query(Transaction)
        .filter(Transaction.transaction_id == transaction_id)
        .first()
    )
    if not entity or (account.role != "admin" and entity.user_id != account.user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    payload_date = payload.date if payload.date.tzinfo else payload.date.replace(tzinfo=timezone.utc)
    if payload_date > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction date cannot be in the future",
        )

    entity.amount = payload.amount
    entity.type = payload.type
    entity.date = payload.date
    entity.description = payload.description or "Manual transaction entry"
    entity.score = min(int(payload.amount / 50), 1000)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transaction '{transaction_id}' could not be updated",
        ) from None

    db.refresh(entity)
    return entity
