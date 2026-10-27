"""Pydantic schemas for signup, login, and auth responses."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)  # Minimum 8 characters


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthUser(BaseModel):
    id: int
    name: str
    email: str
    userId: str
    role: str = "user"
    avatar: str
    bio: str | None = None
    phone: str | None = None
    location: str | None = None
    createdAt: datetime


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    avatar: str | None = Field(default=None, max_length=64)
    bio: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=32)
    location: str | None = Field(default=None, max_length=120)


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: AuthUser
