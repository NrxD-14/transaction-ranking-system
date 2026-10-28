"""Pydantic schemas for transaction create/read — validates API request bodies."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TransactionType = Literal["transfer", "payment", "deposit", "withdrawal", "refund"]
TransactionStatus = Literal["completed", "pending", "failed"]


class TransactionCreate(BaseModel):
    transactionId: str = Field(min_length=4, max_length=64)  # Business ID, must be globally unique
    userId: str = Field(min_length=4, max_length=32)
    amount: float = Field(gt=0)  # Must be positive
    type: TransactionType
    date: datetime
    description: str = Field(default="", max_length=255)
    status: TransactionStatus = "completed"


class TransactionUpdate(BaseModel):
    amount: float = Field(gt=0)
    type: TransactionType
    date: datetime
    description: str = Field(default="", max_length=255)


class TransactionDeletionRequestCreate(BaseModel):
    reason: str = Field(min_length=5, max_length=500)


class TransactionDeletionRequestDecision(BaseModel):
    approved: bool
    note: str | None = Field(default=None, max_length=500)


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    userId: str
    userName: str
    userAvatar: str
    userProfilePicture: str | None = None
    amount: float
    type: TransactionType
    date: datetime
    status: TransactionStatus
    score: int
    description: str
