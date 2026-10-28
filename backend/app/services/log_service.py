"""System log recording and retrieval for admin audit trail.

Transaction Ranking System — Narayan Dev
"""
import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Account, SystemLog, Transaction, User


def record_log(
    db: Session,
    *,
    category: str,
    message: str,
    level: str = "info",
    user_email: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        SystemLog(
            level=level,
            category=category,
            message=message,
            user_email=user_email,
            metadata_json=json.dumps(metadata) if metadata else None,
            created_at=datetime.utcnow(),
        )
    )
    db.commit()


def get_logs(
    db: Session,
    *,
    category: str | None = None,
    level: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SystemLog], int]:
    query = db.query(SystemLog).order_by(SystemLog.created_at.desc())
    if category:
        query = query.filter(SystemLog.category == category)
    if level:
        query = query.filter(SystemLog.level == level)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            SystemLog.message.ilike(term) | SystemLog.user_email.ilike(term)
        )
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return rows, total


def get_log_details(db: Session, log_id: int) -> dict | None:
    selected_log = db.query(SystemLog).filter(SystemLog.id == log_id).first()
    if not selected_log:
        return None

    account_details = None
    transactions = []
    activities = [selected_log]

    if selected_log.user_email:
        account = db.query(Account).filter(Account.email == selected_log.user_email).first()
        user = account.user if account else db.query(User).filter(User.email == selected_log.user_email).first()
        activities = (
            db.query(SystemLog)
            .filter(SystemLog.user_email == selected_log.user_email)
            .order_by(SystemLog.created_at.desc(), SystemLog.id.desc())
            .all()
        )

        if user:
            transaction_rows = (
                db.query(Transaction)
                .filter(Transaction.user_id == user.id)
                .order_by(Transaction.id.desc())
                .all()
            )
            account_details = {
                "userId": user.id,
                "name": user.name,
                "email": user.email,
                "role": account.role if account else "user",
                "avatar": user.avatar,
                "profilePicture": user.profile_picture,
                "phone": user.phone,
                "location": user.location,
                "bio": user.bio,
                "joinedAt": user.joined_at,
                "transactionCount": len(transaction_rows),
                "totalAmount": round(sum(row.amount for row in transaction_rows), 2),
            }
            transactions = [
                {
                    "id": row.transaction_id,
                    "userId": row.user_id,
                    "userName": user.name,
                    "userAvatar": user.avatar,
                    "userProfilePicture": user.profile_picture,
                    "amount": row.amount,
                    "type": row.type,
                    "date": row.date.isoformat(),
                    "status": row.status,
                    "score": row.score,
                    "description": row.description,
                }
                for row in transaction_rows
            ]

    return {
        "account": account_details,
        "transactions": transactions,
        "activities": activities,
    }
