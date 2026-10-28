"""Transaction API route: POST /transaction."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account, require_admin
from app.models import Account, Transaction, TransactionDeletionRequest
from app.schemas.transaction import (
    TransactionCreate,
    TransactionDeletionRequestCreate,
    TransactionDeletionRequestDecision,
    TransactionResponse,
    TransactionUpdate,
)
from app.services.log_service import record_log
from app.services.transaction_service import create_transaction, update_transaction

router = APIRouter(tags=["Transactions"])


def _transaction_response(tx: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=tx.transaction_id,
        userId=tx.user_id,
        userName=tx.user.name,
        userAvatar=tx.user.avatar,
        userProfilePicture=tx.user.profile_picture,
        amount=tx.amount,
        type=tx.type,
        date=tx.date,
        status=tx.status,
        score=tx.score,
        description=tx.description,
    )


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
    return _transaction_response(tx)


@router.patch("/transaction/{transaction_id}", response_model=TransactionResponse)
def update_transaction_endpoint(
    transaction_id: str,
    payload: TransactionUpdate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    previous_values = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    previous = None if previous_values is None else {
        "amount": previous_values.amount,
        "type": previous_values.type,
        "date": previous_values.date.isoformat(),
        "status": previous_values.status,
        "score": previous_values.score,
        "description": previous_values.description,
    }
    tx = update_transaction(db, transaction_id, payload, account)
    record_log(
        db,
        category="transaction",
        message=f"Transaction {tx.transaction_id} edited and resubmitted for ${tx.amount:,.2f}",
        user_email=account.email,
        metadata={
            "transactionId": tx.transaction_id,
            "userId": tx.user_id,
            "previous": previous,
            "updated": {
                "amount": tx.amount,
                "type": tx.type,
                "date": tx.date.isoformat(),
                "status": tx.status,
                "score": tx.score,
                "description": tx.description,
            },
        },
    )
    return _transaction_response(tx)


def _deletion_request_response(request: TransactionDeletionRequest) -> dict:
    return {
        "id": request.id,
        "transactionId": request.transaction_id,
        "userId": request.user_id,
        "transactionAmount": request.transaction_amount,
        "transactionType": request.transaction_type,
        "transactionDate": request.transaction_date,
        "transactionDescription": request.transaction_description,
        "requesterEmail": request.requester_email,
        "reason": request.reason,
        "status": request.status,
        "requestedAt": request.requested_at,
        "respondedAt": request.responded_at,
        "completedAt": request.completed_at,
        "responseNote": request.response_note,
    }


@router.post("/admin/transactions/{transaction_id}/deletion-requests", status_code=status.HTTP_201_CREATED)
def request_transaction_deletion(
    transaction_id: str,
    payload: TransactionDeletionRequestCreate,
    account: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    existing = (
        db.query(TransactionDeletionRequest)
        .filter(
            TransactionDeletionRequest.transaction_id == transaction_id,
            TransactionDeletionRequest.status.in_(["pending", "approved"]),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active deletion request already exists for this transaction",
        )

    request = TransactionDeletionRequest(
        transaction_id=tx.transaction_id,
        user_id=tx.user_id,
        transaction_amount=tx.amount,
        transaction_type=tx.type,
        transaction_date=tx.date,
        transaction_description=tx.description,
        requester_email=account.email,
        reason=payload.reason,
        status="pending",
        requested_at=datetime.utcnow(),
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    record_log(
        db,
        category="transaction",
        message=f"Admin requested deletion of transaction {tx.transaction_id}",
        user_email=account.email,
        metadata={"transactionId": tx.transaction_id, "userId": tx.user_id, "requestId": request.id},
    )
    return _deletion_request_response(request)


@router.get("/admin/transaction-deletion-requests")
def get_admin_deletion_requests(
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(TransactionDeletionRequest)
        .order_by(TransactionDeletionRequest.requested_at.desc(), TransactionDeletionRequest.id.desc())
        .all()
    )
    return {"requests": [_deletion_request_response(request) for request in requests]}


@router.get("/notifications/transaction-deletion-requests")
def get_user_deletion_requests(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(TransactionDeletionRequest)
        .filter(TransactionDeletionRequest.user_id == account.user_id)
        .order_by(TransactionDeletionRequest.requested_at.desc(), TransactionDeletionRequest.id.desc())
        .limit(100)
        .all()
    )
    return {"requests": [_deletion_request_response(request) for request in requests]}


@router.patch("/notifications/transaction-deletion-requests/{request_id}")
def respond_to_deletion_request(
    request_id: int,
    payload: TransactionDeletionRequestDecision,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    request = (
        db.query(TransactionDeletionRequest)
        .filter(
            TransactionDeletionRequest.id == request_id,
            TransactionDeletionRequest.user_id == account.user_id,
        )
        .first()
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deletion request not found")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This request has already been answered")

    request.status = "approved" if payload.approved else "rejected"
    request.responded_at = datetime.utcnow()
    request.response_note = payload.note
    db.commit()
    db.refresh(request)
    decision = "approved" if payload.approved else "rejected"
    record_log(
        db,
        category="transaction",
        message=f"User {decision} deletion request for transaction {request.transaction_id}",
        user_email=account.email,
        metadata={"transactionId": request.transaction_id, "requestId": request.id},
    )
    return _deletion_request_response(request)


@router.post("/admin/transaction-deletion-requests/{request_id}/delete")
def finalize_transaction_deletion(
    request_id: int,
    account: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    request = (
        db.query(TransactionDeletionRequest)
        .filter(TransactionDeletionRequest.id == request_id)
        .with_for_update()
        .first()
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deletion request not found")
    if request.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The user must approve the deletion before an admin can delete this transaction",
        )

    tx = db.query(Transaction).filter(Transaction.transaction_id == request.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction no longer exists")

    db.delete(tx)
    request.status = "deleted"
    request.completed_at = datetime.utcnow()
    db.commit()
    record_log(
        db,
        category="transaction",
        message=f"Admin deleted transaction {request.transaction_id} after user approval",
        user_email=account.email,
        metadata={"transactionId": request.transaction_id, "userId": request.user_id, "requestId": request.id},
    )
    return {"message": "Transaction deleted after user approval", "request": _deletion_request_response(request)}
