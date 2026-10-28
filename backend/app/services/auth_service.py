"""Authentication business logic: bcrypt hashing, JWT tokens, signup, and login."""
import base64
import binascii
import bcrypt
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Account, User

AVATARS = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500",
    "bg-cyan-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500",
]
MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024


def _validate_profile_picture(profile_picture: str) -> None:
    if not profile_picture:
        return
    header, separator, encoded_image = profile_picture.partition(",")
    allowed_headers = {
        "data:image/png;base64",
        "data:image/jpeg;base64",
        "data:image/webp;base64",
    }
    if not separator or header not in allowed_headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile picture must be a PNG, JPEG, or WebP image",
        )
    try:
        image = base64.b64decode(encoded_image, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile picture data is invalid",
        ) from exc
    if len(image) > MAX_PROFILE_PICTURE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Profile picture must be 2 MB or smaller",
        )

    image_signatures = {
        "data:image/png;base64": image.startswith(b"\x89PNG\r\n\x1a\n"),
        "data:image/jpeg;base64": image.startswith(b"\xff\xd8\xff"),
        "data:image/webp;base64": len(image) >= 12 and image[:4] == b"RIFF" and image[8:12] == b"WEBP",
    }
    if not image_signatures[header]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file does not match its image type",
        )


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(account_id: int, role: str = "user") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(account_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> tuple[int, str]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        account_id = int(payload.get("sub", 0))
        role = payload.get("role", "user")
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
    if account_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return account_id, role


def _next_user_id(db: Session) -> str:
    while True:
        user_id = f"USR-{uuid4().hex[:12].upper()}"
        if not db.query(User.id).filter(User.id == user_id).first():
            return user_id


def _avatar_for_name(name: str) -> str:
    return AVATARS[sum(ord(c) for c in name) % len(AVATARS)]


def signup(db: Session, name: str, email: str, password: str) -> tuple[Account, str]:
    existing = db.query(Account).filter(Account.email == email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        id=_next_user_id(db),
        name=name.strip(),
        email=email.lower(),
        avatar=_avatar_for_name(name),
        joined_at=datetime.utcnow(),
    )
    account = Account(
        email=email.lower(),
        name=name.strip(),
        password_hash=hash_password(password),
        role="user",
        user_id=user.id,
        created_at=datetime.utcnow(),
    )

    try:
        db.add(user)
        db.add(account)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from None

    db.refresh(account)
    db.refresh(user)
    token = create_access_token(account.id, account.role)
    return account, token


def login(db: Session, email: str, password: str) -> tuple[Account, str]:
    account = db.query(Account).filter(Account.email == email.lower()).first()
    if not account or not verify_password(password, account.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(account.id, account.role)
    return account, token


def update_profile(
    db: Session,
    account: Account,
    *,
    name: str | None = None,
    email: str | None = None,
    avatar: str | None = None,
    profile_picture: str | None = None,
    profile_picture_provided: bool = False,
    bio: str | None = None,
    phone: str | None = None,
    location: str | None = None,
) -> Account:
    user = account.user

    if name is not None:
        cleaned_name = name.strip()
        account.name = cleaned_name
        user.name = cleaned_name

    if email is not None:
        email_lower = email.lower()
        existing = (
            db.query(Account)
            .filter(Account.email == email_lower, Account.id != account.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        account.email = email_lower
        user.email = email_lower

    if avatar is not None:
        if avatar not in AVATARS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid avatar selection",
            )
        user.avatar = avatar

    if profile_picture_provided:
        if profile_picture is None:
            user.profile_picture = None
        else:
            _validate_profile_picture(profile_picture)
            user.profile_picture = profile_picture or None

    if bio is not None:
        user.bio = bio.strip() or None

    if phone is not None:
        user.phone = phone.strip() or None

    if location is not None:
        user.location = location.strip() or None

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from None

    db.refresh(account)
    db.refresh(user)
    return account


def get_account_by_id(db: Session, account_id: int) -> Account:
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found",
        )
    return account
