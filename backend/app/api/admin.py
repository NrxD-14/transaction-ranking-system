"""Admin API routes — protected by require_admin (HTTP 403 for non-admins).

Transaction Ranking System — Narayan Dev
"""
from datetime import datetime, time

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io

from app.config import settings
from app.database import get_db
from app.dependencies import require_admin
from app.models import Account
from app.schemas.admin import (
    AdminAnalytics,
    AdminLogsResponse,
    AdminLogEntry,
    AdminLogDetails,
    AdminSettingsInfo,
    AdminStats,
    AdminTransactionsResponse,
    AdminUsersResponse,
    AdminUserRow,
)
from app.services.admin_service import (
    get_admin_transactions,
    get_admin_users,
    get_analytics,
    get_dashboard_stats,
    get_settings_info,
)
from app.services.log_service import get_log_details, get_logs
from app.services.ranking_service import build_ranking, get_score_factors_for_user
from app.models import Transaction

router = APIRouter(prefix="/admin", tags=["Admin"])


def _parse_date_to(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if len(value) == 10:
        return datetime.combine(parsed.date(), time.max)
    return parsed


@router.get("/dashboard", response_model=AdminStats)
def admin_dashboard(_: Account = Depends(require_admin), db: Session = Depends(get_db)):
    return get_dashboard_stats(db)


@router.get("/users", response_model=AdminUsersResponse)
def admin_users(
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
    search: str | None = None,
    role: str | None = None,
    sortBy: str = "joinedAt",
    sortDir: str = "desc",
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
):
    users, total = get_admin_users(
        db, search=search, role=role, sort_by=sortBy, sort_dir=sortDir,
        page=page, page_size=pageSize,
    )
    return AdminUsersResponse(
        users=[AdminUserRow(**u) for u in users],
        total=total,
        page=page,
        pageSize=pageSize,
    )


@router.get("/transactions", response_model=AdminTransactionsResponse)
def admin_transactions(
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
    search: str | None = None,
    status: str | None = None,
    type: str | None = None,
    dateFrom: str | None = None,
    dateTo: str | None = None,
    sortBy: str = "created",
    sortDir: str = "desc",
    page: int = Query(1, ge=1),
    pageSize: int = Query(15, ge=1, le=100),
):
    date_from = datetime.fromisoformat(dateFrom) if dateFrom else None
    date_to = _parse_date_to(dateTo)
    txs, total = get_admin_transactions(
        db, search=search, status=status, tx_type=type,
        date_from=date_from, date_to=date_to,
        sort_by=sortBy, sort_dir=sortDir, page=page, page_size=pageSize,
    )
    return AdminTransactionsResponse(
        transactions=txs, total=total, page=page, pageSize=pageSize,
    )


@router.get("/transactions/export")
def export_transactions(
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
    search: str | None = None,
    status: str | None = None,
    type: str | None = None,
    dateFrom: str | None = None,
    dateTo: str | None = None,
):
    date_from = datetime.fromisoformat(dateFrom) if dateFrom else None
    date_to = _parse_date_to(dateTo)
    txs, _ = get_admin_transactions(
        db, search=search, status=status, tx_type=type,
        date_from=date_from, date_to=date_to, page=1, page_size=10000,
    )
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "userId", "userName", "amount", "type", "date", "status", "score", "description"],
    )
    writer.writeheader()
    writer.writerows(txs)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@router.get("/leaderboard")
def admin_leaderboard(_: Account = Depends(require_admin), db: Session = Depends(get_db)):
    ranking = build_ranking(db)
    formula = {
        "volume": "min(totalAmount / 1500, 100) × 35%",
        "count": "min(txCount × 3, 100) × 20%",
        "consistency": "min(uniqueDays × 4, 100) × 20%",
        "recency": "max(100 - daysSinceLast × 2, 10) × 15%",
        "diversity": "min(uniqueTypes × 20, 100) × 10%",
        "final": "Σ(factors) × 10",
    }
    return {"users": [u.model_dump() for u in ranking], "formula": formula}


@router.get("/leaderboard/{user_id}/breakdown")
def score_breakdown(
    user_id: str,
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    txs = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    factors = get_score_factors_for_user(txs)
    return {"userId": user_id, "factors": factors}


@router.get("/analytics", response_model=AdminAnalytics)
def admin_analytics(_: Account = Depends(require_admin), db: Session = Depends(get_db)):
    return get_analytics(db)


@router.get("/logs", response_model=AdminLogsResponse)
def admin_logs(
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
    category: str | None = None,
    level: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
):
    rows, total = get_logs(db, category=category, level=level, search=search, page=page, page_size=pageSize)
    return AdminLogsResponse(
        logs=[
            AdminLogEntry(
                id=log.id, level=log.level, category=log.category,
                message=log.message, userEmail=log.user_email, createdAt=log.created_at,
            )
            for log in rows
        ],
        total=total,
        page=page,
        pageSize=pageSize,
    )


@router.get("/logs/{log_id}/details", response_model=AdminLogDetails)
def admin_log_details(
    log_id: int,
    _: Account = Depends(require_admin),
    db: Session = Depends(get_db),
):
    details = get_log_details(db, log_id)
    if details is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="System log entry not found",
        )
    return AdminLogDetails(
        account=details["account"],
        transactions=details["transactions"],
        activities=[
            AdminLogEntry(
                id=log.id,
                level=log.level,
                category=log.category,
                message=log.message,
                userEmail=log.user_email,
                createdAt=log.created_at,
            )
            for log in details["activities"]
        ],
    )


@router.get("/settings", response_model=AdminSettingsInfo)
def admin_settings(_: Account = Depends(require_admin)):
    return get_settings_info()


@router.get("/health")
def admin_health(_: Account = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "api": "operational",
        "database": "connected" if db_ok else "disconnected",
        "version": settings.app_version,
    }
