"""Admin dashboard business logic and aggregated statistics.

Transaction Ranking System — Narayan Dev
"""
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Account, SystemLog, Transaction, User
from app.services.ranking_service import build_ranking


def get_dashboard_stats(db: Session) -> dict:
    total_users = db.query(User).count()
    total_transactions = db.query(Transaction).count()
    revenue_result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).scalar()
    total_revenue = float(revenue_result or 0)
    average_transaction = total_revenue / total_transactions if total_transactions else 0

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_transactions = (
        db.query(Transaction).filter(Transaction.date >= today_start).count()
    )

    ranking = build_ranking(db)
    top_user = ranking[0].model_dump() if ranking else None

    recent_tx = (
        db.query(Transaction)
        .order_by(Transaction.id.desc())
        .limit(8)
        .all()
    )
    recent_activities = [
        {
            "id": tx.transaction_id,
            "userId": tx.user_id,
            "userName": tx.user.name,
            "userAvatar": tx.user.avatar,
            "userProfilePicture": tx.user.profile_picture,
            "action": f"{tx.type.title()} transaction",
            "amount": tx.amount,
            "time": tx.date.isoformat(),
            "type": tx.type,
            "status": tx.status,
        }
        for tx in recent_tx
    ]

    error_count = db.query(SystemLog).filter(SystemLog.level == "error").count()
    warning_count = db.query(SystemLog).filter(SystemLog.level == "warning").count()
    health_score = max(100 - (error_count * 5) - (warning_count * 2), 60)

    return {
        "totalUsers": total_users,
        "totalTransactions": total_transactions,
        "totalRevenue": round(total_revenue, 2),
        "averageTransaction": round(average_transaction, 2),
        "todayTransactions": today_transactions,
        "topRankedUser": top_user,
        "recentActivities": recent_activities,
        "systemHealth": {
            "score": health_score,
            "status": "healthy" if health_score >= 90 else "degraded" if health_score >= 70 else "critical",
            "errors": error_count,
            "warnings": warning_count,
        },
        "apiStatus": "operational",
        "databaseStatus": "connected",
    }


def get_admin_users(
    db: Session,
    *,
    search: str | None = None,
    role: str | None = None,
    sort_by: str = "joinedAt",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[dict], int]:
    query = db.query(User, Account).outerjoin(Account, Account.user_id == User.id)

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            User.name.ilike(term) | User.email.ilike(term) | User.id.ilike(term)
        )
    if role:
        query = query.filter(Account.role == role)

    rows = query.all()
    result: list[dict] = []
    for user, account in rows:
        tx_stats = (
            db.query(
                func.count(Transaction.id),
                func.coalesce(func.sum(Transaction.amount), 0),
            )
            .filter(Transaction.user_id == user.id)
            .one()
        )
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar,
            "profilePicture": user.profile_picture,
            "role": account.role if account else "user",
            "joinedAt": user.joined_at,
            "transactionCount": tx_stats[0] or 0,
            "totalAmount": round(float(tx_stats[1] or 0), 2),
        })

    reverse = sort_dir == "desc"
    sort_keys = {
        "name": lambda r: r["name"].lower(),
        "email": lambda r: r["email"].lower(),
        "role": lambda r: r["role"],
        "joinedAt": lambda r: r["joinedAt"],
        "transactionCount": lambda r: r["transactionCount"],
        "totalAmount": lambda r: r["totalAmount"],
    }
    key_fn = sort_keys.get(sort_by, sort_keys["joinedAt"])
    result.sort(key=key_fn, reverse=reverse)

    total = len(result)
    start = (page - 1) * page_size
    return result[start : start + page_size], total


def get_admin_transactions(
    db: Session,
    *,
    search: str | None = None,
    status: str | None = None,
    tx_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str = "created",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 15,
) -> tuple[list[dict], int]:
    query = db.query(Transaction).join(User)

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Transaction.transaction_id.ilike(term)
            | User.name.ilike(term)
            | Transaction.description.ilike(term)
        )
    if status:
        query = query.filter(Transaction.status == status)
    if tx_type:
        query = query.filter(Transaction.type == tx_type)
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)

    reverse = sort_dir == "desc"
    if sort_by == "amount":
        query = query.order_by(Transaction.amount.desc() if reverse else Transaction.amount.asc())
    elif sort_by == "date":
        query = query.order_by(Transaction.date.desc() if reverse else Transaction.date.asc())
    else:
        query = query.order_by(Transaction.id.desc() if reverse else Transaction.id.asc())

    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    return [
        {
            "id": tx.transaction_id,
            "userId": tx.user_id,
            "userName": tx.user.name,
            "userAvatar": tx.user.avatar,
            "userProfilePicture": tx.user.profile_picture,
            "amount": tx.amount,
            "type": tx.type,
            "date": tx.date.isoformat(),
            "status": tx.status,
            "score": tx.score,
            "description": tx.description,
        }
        for tx in rows
    ], total


def get_analytics(db: Session) -> dict:
    transactions = db.query(Transaction).order_by(Transaction.date.asc()).all()
    users = db.query(User).order_by(User.joined_at.asc()).all()

    revenue_map: dict[str, float] = {}
    tx_count_map: dict[str, int] = {}
    type_map: dict[str, int] = {}
    daily_map: dict[str, int] = {}

    for tx in transactions:
        day_key = tx.date.strftime("%Y-%m-%d")
        revenue_map[day_key] = revenue_map.get(day_key, 0) + tx.amount
        tx_count_map[day_key] = tx_count_map.get(day_key, 0) + 1
        type_map[tx.type] = type_map.get(tx.type, 0) + 1
        daily_map[day_key] = daily_map.get(day_key, 0) + 1

    revenue = [
        {"date": k, "amount": round(v, 2)}
        for k, v in sorted(revenue_map.items())[-30:]
    ]
    tx_chart = [
        {"date": k, "count": v}
        for k, v in sorted(tx_count_map.items())[-30:]
    ]

    user_growth_map: dict[str, int] = {}
    cumulative = 0
    for user in users:
        key = user.joined_at.strftime("%Y-%m")
        cumulative += 1
        user_growth_map[key] = cumulative
    user_growth = [{"month": k, "users": v} for k, v in sorted(user_growth_map.items())]

    daily_activity = [
        {"date": datetime.strptime(k, "%Y-%m-%d").strftime("%b %d"), "count": v}
        for k, v in sorted(daily_map.items())[-14:]
    ]

    type_colors = {
        "transfer": "#7C3AED", "payment": "#3B82F6", "deposit": "#10B981",
        "withdrawal": "#F59E0B", "refund": "#EF4444",
    }
    transaction_types = [
        {"name": k.title(), "value": v, "color": type_colors.get(k, "#6B7280")}
        for k, v in type_map.items()
    ]

    ranking = build_ranking(db)
    top_users = [
        {"name": u.name, "score": u.score, "amount": u.totalAmount}
        for u in ranking[:8]
    ]

    monthly_map: dict[str, dict] = {}
    for tx in transactions:
        key = tx.date.strftime("%Y-%m")
        if key not in monthly_map:
            monthly_map[key] = {"revenue": 0, "count": 0}
        monthly_map[key]["revenue"] += tx.amount
        monthly_map[key]["count"] += 1
    monthly_trend = [
        {"month": k, "revenue": round(v["revenue"], 2), "count": v["count"]}
        for k, v in sorted(monthly_map.items())
    ]

    return {
        "revenue": revenue,
        "transactions": tx_chart,
        "userGrowth": user_growth,
        "dailyActivity": daily_activity,
        "transactionTypes": transaction_types,
        "topUsers": top_users,
        "monthlyTrend": monthly_trend,
    }


def get_settings_info() -> dict:
    return {
        "applicationVersion": settings.app_version,
        "database": "SQLite" if settings.database_url.startswith("sqlite") else "PostgreSQL",
        "backendStatus": "running",
        "environment": "development" if "dev" in settings.jwt_secret.lower() else "production",
        "apiVersion": settings.app_version,
        "developer": {
            "name": "Narayan Dev",
            "email": "devn038@gmail.com",
            "github": "https://github.com/NrxD-14",
        },
    }
