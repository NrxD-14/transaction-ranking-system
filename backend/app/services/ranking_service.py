"""Multi-factor ranking algorithm — computes scores and builds sorted leaderboard."""
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Transaction, User
from app.schemas.ranking import RankingUser


def _badge_by_rank(rank: int) -> str:
    if rank == 1:
        return "gold"
    if rank == 2:
        return "silver"
    if rank == 3:
        return "bronze"
    return "none"


def _calculate_user_score(transactions: list[Transaction]) -> dict[str, int]:
    if not transactions:
        return {
            "volume_score": 0,
            "count_score": 0,
            "consistency_score": 0,
            "recency_score": 0,
            "diversity_score": 0,
            "total_score": 0,
        }

    total_amount = sum(tx.amount for tx in transactions)
    tx_count = len(transactions)
    unique_days = len({tx.date.date().isoformat() for tx in transactions})
    unique_types = len({tx.type for tx in transactions})
    latest_tx = max(transactions, key=lambda tx: tx.date)
    days_since_recent = max((datetime.utcnow() - latest_tx.date).days, 0)

    volume_score = min(int(total_amount / 1500), 100)
    count_score = min(tx_count * 3, 100)
    consistency_score = min(unique_days * 4, 100)
    recency_score = max(100 - (days_since_recent * 2), 10)
    diversity_score = min(unique_types * 20, 100)

    # Weighted composite score: volume 35%, count 20%, consistency 20%, recency 15%, diversity 10%
    total_score = int(
        (volume_score * 0.35)
        + (count_score * 0.2)
        + (consistency_score * 0.2)
        + (recency_score * 0.15)
        + (diversity_score * 0.1)
    ) * 10

    return {
        "volume_score": volume_score,
        "count_score": count_score,
        "consistency_score": consistency_score,
        "recency_score": recency_score,
        "diversity_score": diversity_score,
        "total_score": total_score,
    }


def build_ranking(db: Session) -> list[RankingUser]:
    users = db.query(User).all()
    rows: list[dict] = []

    for user in users:
        user_transactions = (
            db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).all()
        )
        score = _calculate_user_score(user_transactions)
        total_amount = sum(tx.amount for tx in user_transactions)
        tx_count = len(user_transactions)
        unique_days = len({tx.date.date().isoformat() for tx in user_transactions})
        consistency = min(unique_days * 4, 100) if tx_count else 0
        recent_activity = user_transactions[0].date if tx_count else user.joined_at

        rows.append(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar,
                "joinedAt": user.joined_at,
                "score": score["total_score"],
                "totalAmount": round(total_amount, 2),
                "transactionCount": tx_count,
                "consistency": consistency,
                "recentActivity": recent_activity,
            }
        )

    rows.sort(key=lambda item: item["score"], reverse=True)
    ranked: list[RankingUser] = []
    for index, row in enumerate(rows, start=1):
        ranked.append(RankingUser(rank=index, badge=_badge_by_rank(index), **row))

    return ranked


def get_score_factors_for_user(transactions: list[Transaction]) -> dict[str, int]:
    return _calculate_user_score(transactions)
