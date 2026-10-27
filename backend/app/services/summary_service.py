"""User summary service — aggregates stats and score breakdown for one user."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Transaction, User
from app.schemas.summary import ScoreFactors, UserSummary
from app.schemas.transaction import TransactionResponse
from app.services.ranking_service import build_ranking, get_score_factors_for_user


def get_user_summary(db: Session, user_id: str) -> UserSummary:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found",
        )

    transactions = (
        db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date.desc()).all()
    )
    ranking = build_ranking(db)
    rank = next((item.rank for item in ranking if item.id == user_id), len(ranking))

    total_amount = sum(tx.amount for tx in transactions)
    tx_count = len(transactions)
    active_days = len({tx.date.date().isoformat() for tx in transactions})
    average_amount = (total_amount / tx_count) if tx_count else 0
    recent_activity = transactions[0].date if tx_count else user.joined_at
    score_data = get_score_factors_for_user(transactions)

    recent_transactions = [
        TransactionResponse(
            id=tx.transaction_id,
            userId=tx.user_id,
            userName=user.name,
            userAvatar=user.avatar,
            amount=tx.amount,
            type=tx.type,
            date=tx.date,
            status=tx.status,
            score=tx.score,
            description=tx.description,
        )
        for tx in transactions[:10]
    ]

    return UserSummary(
        userId=user.id,
        userName=user.name,
        email=user.email,
        avatar=user.avatar,
        rank=rank,
        totalAmount=round(total_amount, 2),
        transactionCount=tx_count,
        averageAmount=round(average_amount, 2),
        activeDays=active_days,
        recentActivity=recent_activity,
        scoreFactors=ScoreFactors(
            volumeScore=score_data["volume_score"],
            countScore=score_data["count_score"],
            consistencyScore=score_data["consistency_score"],
            recencyScore=score_data["recency_score"],
            diversityScore=score_data["diversity_score"],
            totalScore=score_data["total_score"],
        ),
        recentTransactions=recent_transactions,
    )
