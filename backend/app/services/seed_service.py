"""Seed demo users, transactions, admin account, and system logs.

Transaction Ranking System — Narayan Dev
"""
import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Account, SystemLog, Transaction, User
from app.services.auth_service import hash_password, verify_password

ADMIN_EMAIL = "devn038@gmail.com"
ADMIN_PASSWORD = "Narayan@321"
ADMIN_NAME = "Narayan Dev"

FIRST_NAMES = [
    "Alexandra", "Marcus", "Sophia", "James", "Isabella", "Ethan", "Olivia", "Noah",
    "Emma", "Liam", "Ava", "William", "Mia", "Benjamin", "Charlotte", "Elijah",
    "Amelia", "Lucas", "Harper", "Mason", "Evelyn", "Logan", "Abigail", "Sebastian",
    "Emily", "Jack", "Elizabeth", "Aiden", "Sofia", "Owen",
]
LAST_NAMES = [
    "Chen", "Rodriguez", "Kim", "Thompson", "Patel", "Johnson", "Williams", "Brown",
    "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson",
    "White", "Harris", "Martin", "Garcia", "Martinez", "Robinson", "Clark", "Lewis",
    "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez",
]
AVATARS = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500",
    "bg-cyan-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500",
]
TYPES = ["transfer", "payment", "deposit", "withdrawal", "refund"]
STATUSES = ["completed", "completed", "completed", "pending", "failed"]
DESCRIPTIONS = {
    "transfer": ["Wire transfer", "Inter-account transfer", "Bank transfer"],
    "payment": ["Merchant payment", "Invoice settlement", "Subscription payment"],
    "deposit": ["Cash deposit", "Direct deposit", "Payroll deposit"],
    "withdrawal": ["ATM withdrawal", "Cash withdrawal", "Card debit"],
    "refund": ["Merchant refund", "Disputed charge refund", "Service refund"],
}

DEMO_LOGS = [
    ("info", "login", "Administrator logged in successfully", ADMIN_EMAIL),
    ("info", "login", "User session established from Chrome on Windows", "alexandra.chen@example.com"),
    ("info", "signup", "New user account created", "emma.johnson@example.com"),
    ("info", "transaction", "Transaction TXN-000042 completed — $12,450 transfer", "marcus.rodriguez@example.com"),
    ("info", "transaction", "Transaction TXN-000089 pending approval — $3,200 payment", "sophia.kim@example.com"),
    ("info", "admin", "Admin viewed user management dashboard", ADMIN_EMAIL),
    ("info", "admin", "Admin exported transaction report (CSV)", ADMIN_EMAIL),
    ("warning", "transaction", "High-value transaction flagged for review — $48,900", "james.thompson@example.com"),
    ("warning", "system", "Database connection pool reached 80% capacity", None),
    ("error", "transaction", "Transaction TXN-000156 failed — insufficient funds", "isabella.patel@example.com"),
    ("error", "system", "API rate limit exceeded for external webhook endpoint", None),
    ("info", "login", "User logged in from mobile device", "olivia.williams@example.com"),
    ("info", "signup", "New user registered via signup form", "noah.brown@example.com"),
    ("info", "transaction", "Bulk deposit processed — $25,000", "ethan.davis@example.com"),
    ("info", "admin", "Admin updated system settings", ADMIN_EMAIL),
    ("warning", "login", "Multiple failed login attempts detected", "unknown@example.com"),
    ("info", "transaction", "Refund issued — $1,250 merchant refund", "ava.miller@example.com"),
    ("info", "login", "Session refreshed via token renewal", "liam.wilson@example.com"),
    ("error", "system", "Background job retry failed — ranking cache refresh", None),
    ("info", "admin", "Admin accessed analytics dashboard", ADMIN_EMAIL),
]


def seed_admin_account(db: Session) -> None:
    primary_email = ADMIN_EMAIL.lower()
    legacy_email = "mysteriousid2573@gmail.com"

    existing = db.query(Account).filter(Account.email.in_([primary_email, legacy_email])).first()
    if existing is None:
        existing = db.query(Account).filter(Account.role == "admin").first()

    if existing:
        user = existing.user
        if user is not None:
            user.email = primary_email
            user.name = ADMIN_NAME
        existing.email = primary_email
        existing.name = ADMIN_NAME
        existing.role = "admin"
        existing.user_id = "USR-ADMIN"
        if not verify_password(ADMIN_PASSWORD, existing.password_hash):
            existing.password_hash = hash_password(ADMIN_PASSWORD)
        db.commit()
        _normalize_admin_logs(db, primary_email, legacy_email)
        return

    user = User(
        id="USR-ADMIN",
        name=ADMIN_NAME,
        email=primary_email,
        avatar="bg-violet-500",
        bio="System administrator and developer of the Transaction Ranking System.",
        joined_at=datetime.utcnow(),
    )
    account = Account(
        email=primary_email,
        name=ADMIN_NAME,
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin",
        user_id=user.id,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.add(account)
    db.commit()
    _normalize_admin_logs(db, primary_email, legacy_email)


def _normalize_admin_logs(db: Session, primary_email: str, legacy_email: str) -> None:
    admin_logs = db.query(SystemLog).filter(
        SystemLog.user_email.in_([primary_email, legacy_email])
    )
    for log in admin_logs:
        log.user_email = primary_email
        if log.category == "login" and log.message.startswith("User logged in:"):
            log.message = "Administrator logged in successfully"
    db.commit()


def seed_demo_logs(db: Session) -> None:
    if db.query(SystemLog).count() > 0:
        return

    now = datetime.utcnow()
    for i, (level, category, message, email) in enumerate(DEMO_LOGS):
        db.add(
            SystemLog(
                level=level,
                category=category,
                message=message,
                user_email=email,
                created_at=now - timedelta(hours=i * 3 + random.randint(0, 60)),
            )
        )
    db.commit()


def seed_database(db: Session) -> None:
    seed_admin_account(db)

    user_count = db.query(User).filter(User.id != "USR-ADMIN").count()
    if user_count > 0:
        seed_demo_logs(db)
        return

    users: list[User] = []
    for i in range(30):
        first = FIRST_NAMES[i]
        last = LAST_NAMES[i]
        user = User(
            id=f"USR-{str(i + 1).zfill(4)}",
            name=f"{first} {last}",
            email=f"{first.lower()}.{last.lower()}@example.com",
            avatar=AVATARS[i % len(AVATARS)],
            joined_at=datetime.utcnow() - timedelta(days=random.randint(30, 720)),
        )
        users.append(user)
        db.add(user)
    db.commit()

    for idx in range(180):
        user = random.choice(users)
        tx_type = random.choice(TYPES)
        amount = random.randint(100, 50000)
        tx = Transaction(
            transaction_id=f"TXN-{str(idx + 1).zfill(6)}",
            user_id=user.id,
            amount=float(amount),
            type=tx_type,
            date=datetime.utcnow() - timedelta(days=random.randint(0, 120)),
            status=random.choice(STATUSES),
            score=min(int(amount / 50), 1000),
            description=random.choice(DESCRIPTIONS[tx_type]),
        )
        db.add(tx)

    db.commit()
    seed_demo_logs(db)
