"""Pydantic schemas for admin panel API responses.

Transaction Ranking System — Narayan Dev
"""
from datetime import datetime

from pydantic import BaseModel


class AdminStats(BaseModel):
    totalUsers: int
    totalTransactions: int
    totalRevenue: float
    averageTransaction: float
    todayTransactions: int
    topRankedUser: dict | None
    recentActivities: list[dict]
    systemHealth: dict
    apiStatus: str
    databaseStatus: str


class AdminUserRow(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    role: str
    joinedAt: datetime
    transactionCount: int
    totalAmount: float


class AdminUsersResponse(BaseModel):
    users: list[AdminUserRow]
    total: int
    page: int
    pageSize: int


class AdminTransactionsResponse(BaseModel):
    transactions: list[dict]
    total: int
    page: int
    pageSize: int


class AdminLogEntry(BaseModel):
    id: int
    level: str
    category: str
    message: str
    userEmail: str | None
    createdAt: datetime


class AdminLogsResponse(BaseModel):
    logs: list[AdminLogEntry]
    total: int
    page: int
    pageSize: int


class AdminLogDetails(BaseModel):
    account: dict | None
    transactions: list[dict]
    activities: list[AdminLogEntry]


class AdminAnalytics(BaseModel):
    revenue: list[dict]
    transactions: list[dict]
    userGrowth: list[dict]
    dailyActivity: list[dict]
    transactionTypes: list[dict]
    topUsers: list[dict]
    monthlyTrend: list[dict]


class AdminSettingsInfo(BaseModel):
    applicationVersion: str
    database: str
    backendStatus: str
    environment: str
    apiVersion: str
    developer: dict
