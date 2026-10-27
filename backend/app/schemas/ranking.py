from datetime import datetime
from typing import Literal

from pydantic import BaseModel


BadgeType = Literal["gold", "silver", "bronze", "none"]


class RankingUser(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    joinedAt: datetime
    rank: int
    score: int
    totalAmount: float
    transactionCount: int
    consistency: int
    recentActivity: datetime
    badge: BadgeType


class RankingResponse(BaseModel):
    users: list[RankingUser]
