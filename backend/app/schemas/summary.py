from datetime import datetime

from pydantic import BaseModel

from app.schemas.transaction import TransactionResponse


class ScoreFactors(BaseModel):
    volumeScore: int
    countScore: int
    consistencyScore: int
    recencyScore: int
    diversityScore: int
    totalScore: int


class UserSummary(BaseModel):
    userId: str
    userName: str
    email: str
    avatar: str
    rank: int
    totalAmount: float
    transactionCount: int
    averageAmount: float
    activeDays: int
    recentActivity: datetime
    scoreFactors: ScoreFactors
    recentTransactions: list[TransactionResponse]
