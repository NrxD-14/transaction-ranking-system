"""Auth API routes: signup, login, profile, and session."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_account
from app.models import Account
from app.schemas.auth import AuthResponse, AuthUser, LoginRequest, SignupRequest, UpdateProfileRequest
from app.services.auth_service import login, signup, update_profile
from app.services.log_service import record_log

router = APIRouter(prefix="/auth", tags=["Auth"])


def _to_auth_user(account: Account) -> AuthUser:
    return AuthUser(
        id=account.id,
        name=account.name,
        email=account.email,
        userId=account.user_id,
        role=account.role,
        avatar=account.user.avatar,
        bio=account.user.bio,
        phone=account.user.phone,
        location=account.user.location,
        createdAt=account.created_at,
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup_endpoint(payload: SignupRequest, db: Session = Depends(get_db)):
    account, token = signup(db, payload.name, payload.email, payload.password)
    record_log(
        db, category="signup", message=f"New user registered: {account.email}",
        user_email=account.email,
    )
    return AuthResponse(accessToken=token, user=_to_auth_user(account))


@router.post("/login", response_model=AuthResponse)
def login_endpoint(payload: LoginRequest, db: Session = Depends(get_db)):
    account, token = login(db, payload.email, payload.password)
    record_log(
        db,
        category="login",
        message=(
            "Administrator logged in successfully"
            if account.role == "admin"
            else f"User logged in: {account.email}"
        ),
        user_email=account.email,
    )
    return AuthResponse(accessToken=token, user=_to_auth_user(account))


@router.get("/me", response_model=AuthUser)
def me_endpoint(account: Account = Depends(get_current_account)):
    return _to_auth_user(account)


@router.patch("/me", response_model=AuthUser)
def update_profile_endpoint(
    payload: UpdateProfileRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
):
    updated = update_profile(
        db,
        account,
        name=payload.name,
        email=payload.email,
        avatar=payload.avatar,
        bio=payload.bio,
        phone=payload.phone,
        location=payload.location,
    )
    return _to_auth_user(updated)
