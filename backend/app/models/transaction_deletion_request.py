"""User approval workflow for administrator-requested transaction deletion."""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TransactionDeletionRequest(Base):
    __tablename__ = "transaction_deletion_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), nullable=False, index=True)
    transaction_amount: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    transaction_description: Mapped[str] = mapped_column(Text, nullable=False)
    requester_email: Mapped[str] = mapped_column(String(180), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    response_note: Mapped[str | None] = mapped_column(Text, nullable=True)
