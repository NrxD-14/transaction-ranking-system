"""Ranking profile model — stores user info used for leaderboard and transactions."""
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    avatar: Mapped[str] = mapped_column(String(64), nullable=False)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    account = relationship("Account", back_populates="user", uselist=False)
