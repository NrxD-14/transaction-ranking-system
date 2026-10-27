# Transaction Ranking System — Full Project Explanation

Created by **Narayan Dev**.

This document explains the architecture, APIs, database, validation, ranking logic, data flow, and common interview questions for this project.

---

## 1. Folder Structure

```
Transaction-Ranking-System-main/
│
├── frontend/                    # React + TypeScript + Vite UI
│   ├── src/
│   │   ├── api/                 # (via lib/api.ts) HTTP client + auth token
│   │   ├── components/          # Reusable UI (Layout, Sidebar, ProtectedRoute)
│   │   ├── context/             # Global state (auth, settings, data)
│   │   ├── lib/                 # api.ts, utils.ts
│   │   ├── pages/               # Route screens (Dashboard, Login, etc.)
│   │   ├── types/               # Shared TypeScript interfaces
│   │   ├── App.tsx              # Router + auth guards
│   │   └── main.tsx             # React entry point
│   ├── index.html
│   ├── vite.config.ts           # Dev server + /api proxy to backend
│   └── package.json
│
├── backend/                     # FastAPI + SQLAlchemy API
│   ├── app/
│   │   ├── api/                 # HTTP route handlers (thin layer)
│   │   ├── models/              # SQLAlchemy ORM tables
│   │   ├── schemas/             # Pydantic request/response validation
│   │   ├── services/            # Business logic (ranking, auth, transactions)
│   │   ├── database.py          # Engine, session, get_db dependency
│   │   ├── config.py            # Environment settings
│   │   ├── dependencies.py      # Auth middleware (JWT Bearer)
│   │   └── main.py              # App factory, CORS, exception handlers
│   ├── requirements.txt
│   └── trs.db                   # SQLite database (created at runtime)
│
├── package.json                 # Root scripts: npm run dev (frontend + backend)
├── README.md
└── EXPLANATION.md               # This file
```

### Layer responsibilities

| Layer | Role |
|-------|------|
| **api/** | Receives HTTP requests, validates input via Pydantic, calls services |
| **services/** | Core business rules (ranking math, duplicate checks, auth) |
| **models/** | Database table definitions (SQLAlchemy) |
| **schemas/** | API contracts — what clients send/receive |
| **frontend pages** | UI that calls `/api/*` through Axios |

---

## 2. Every API Endpoint

Base URL (dev): `http://localhost:8000`  
Frontend proxy: `http://localhost:5173/api/*` → backend

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{ "status": "ok" }` |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | No | Register account + create ranking profile |
| POST | `/auth/login` | No | Sign in, returns JWT |
| GET | `/auth/me` | Bearer JWT | Current logged-in user |

**Signup body:**
```json
{ "name": "Narayan", "email": "Narayan@example.com", "password": "password123" }
```

**Login body:**
```json
{ "email": "Narayan@example.com", "password": "password123" }
```

**Auth response:**
```json
{
  "accessToken": "<jwt>",
  "tokenType": "bearer",
  "user": {
    "id": 1,
    "name": "Narayan",
    "email": "Narayan@example.com",
    "userId": "USR-0031",
    "avatar": "bg-violet-500",
    "createdAt": "2026-06-25T10:00:00"
  }
}
```

### Transactions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/transaction` | No* | Create a new transaction |
| GET | `/transactions` | No* | List all transactions (newest first) |

*Auth token is sent by frontend but routes are not yet enforced server-side.

**Create transaction body:**
```json
{
  "transactionId": "TXN-000999",
  "userId": "USR-0001",
  "amount": 12500,
  "type": "transfer",
  "date": "2026-06-20T00:00:00",
  "description": "Wire transfer",
  "status": "completed"
}
```

### Ranking & Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ranking` | No | All users sorted by computed score |
| GET | `/summary/{userId}` | No | Detailed stats + score breakdown for one user |
| GET | `/users` | No | Same ranked user list (alias for frontend) |

### HTTP Status Codes Used

| Code | When |
|------|------|
| 200 | Successful GET/POST login |
| 201 | Transaction or signup created |
| 400 | Future transaction date |
| 401 | Invalid login or expired JWT |
| 404 | User not found |
| 409 | Duplicate email or transaction ID |
| 422 | Pydantic validation failed |
| 500 | Database or unexpected server error |

Swagger docs: `http://localhost:8000/docs`

---

## 3. Database Schema

SQLite file: `backend/trs.db`

### Table: `users` (ranking profiles)

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(32) PK | e.g. `USR-0001` |
| name | VARCHAR(120) | Display name |
| email | VARCHAR(180) UNIQUE | Contact email |
| avatar | VARCHAR(64) | Tailwind color class |
| joined_at | DATETIME | Registration date |

### Table: `accounts` (login credentials)

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| email | VARCHAR(180) UNIQUE | Login email |
| name | VARCHAR(120) | Account holder name |
| password_hash | VARCHAR(255) | bcrypt hash (never store plain text) |
| user_id | VARCHAR(32) FK → users.id UNIQUE | Links login to ranking profile |
| created_at | DATETIME | Signup timestamp |

### Table: `transactions`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Internal row ID |
| transaction_id | VARCHAR(64) UNIQUE | Business ID e.g. `TXN-000001` |
| user_id | VARCHAR(32) FK → users.id | Owner |
| amount | FLOAT | Transaction amount (> 0) |
| type | VARCHAR(20) | transfer, payment, deposit, withdrawal, refund |
| date | DATETIME | When transaction occurred |
| status | VARCHAR(20) | completed, pending, failed |
| score | INTEGER | Per-transaction score |
| description | VARCHAR(255) | Optional note |

### Relationships

```
accounts ──1:1──> users ──1:N──> transactions
```

- One **Account** maps to one **User** (ranking profile).
- One **User** has many **Transactions**.

---

## 4. Validation

Validation happens at **three layers**:

### Layer 1 — Pydantic schemas (API input)

File: `backend/app/schemas/transaction.py`, `auth.py`

Examples:
- `amount` must be `> 0`
- `transactionId` length 4–64 characters
- `type` must be one of five allowed literals
- Signup password minimum 8 characters
- Email must be valid format (`EmailStr`)

FastAPI automatically returns **422** with error details if validation fails.

### Layer 2 — Service business rules

File: `backend/app/services/transaction_service.py`

- User must exist before creating a transaction
- Transaction date cannot be in the future
- Duplicate transaction IDs rejected (see section 6)

### Layer 3 — Frontend form validation

Files: `frontend/src/pages/NewTransaction.tsx`, `Login.tsx`, `Signup.tsx`

- Required fields, positive amounts, password match on signup
- Client-side checks improve UX; server always re-validates

---

## 5. Ranking Algorithm

File: `backend/app/services/ranking_service.py`

Each user's **total score** is a weighted combination of five factors (each capped 0–100):

| Factor | Weight | Formula | Meaning |
|--------|--------|---------|---------|
| Volume | 35% | `min(total_amount / 1500, 100)` | Higher spending = higher score |
| Count | 20% | `min(tx_count * 3, 100)` | More transactions = higher score |
| Consistency | 20% | `min(unique_active_days * 4, 100)` | Activity spread across days |
| Recency | 15% | `max(100 - days_since_last_tx * 2, 10)` | Recent activity rewarded |
| Diversity | 10% | `min(unique_types * 20, 100)` | Using varied transaction types |

**Final score:**
```
total_score = int(
  volume*0.35 + count*0.20 + consistency*0.20 + recency*0.15 + diversity*0.10
) * 10
```

Users are sorted by `total_score` descending. Ranks 1–3 get badges: **gold**, **silver**, **bronze**.

The same factors appear on the **User Summary** page as a score breakdown chart.

---

## 6. Duplicate Prevention

### Transaction IDs

- Database column `transactions.transaction_id` has a **UNIQUE** constraint.
- Before insert, service checks user exists and date is valid.
- On duplicate: SQLAlchemy raises `IntegrityError` → caught → **409 Conflict** returned.

```python
# transaction_service.py
db.commit()  # fails if transaction_id already exists
except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=409, detail="Transaction 'TXN-xxx' already exists")
```

### Account emails

- `accounts.email` is UNIQUE.
- Signup checks for existing email before insert.
- Duplicate signup returns **409**.

### Frontend

- New Transaction page also checks locally against loaded transactions for instant feedback.
- Server remains the source of truth.

---

## 7. Data Flow

### Signup flow

```
User fills Signup form
    → POST /api/auth/signup
    → auth_service.signup()
        → Create User (USR-XXXX)
        → Create Account (bcrypt password)
        → Return JWT + user info
    → Frontend stores token in localStorage
    → Redirect to Dashboard
    → GET /ranking + GET /transactions
```

### Login flow

```
User fills Login form
    → POST /api/auth/login
    → Verify bcrypt hash
    → Return JWT
    → Token attached to all future Axios requests (Authorization: Bearer)
```

### Create transaction flow

```
New Transaction form
    → Client validation
    → POST /api/transaction
    → Pydantic validates body
    → transaction_service.create_transaction()
        → Check user exists
        → Check date not in future
        → INSERT with unique transaction_id
    → 201 + transaction JSON
    → AppContext.reloadData() refreshes dashboard/leaderboard
```

### Dashboard data flow

```
AppContext (on auth success)
    → Parallel: GET /ranking + GET /transactions
    → Store in React state
    → Dashboard, Leaderboard, History read from context (no mock data)
```

### Vite proxy

```
Browser: GET http://localhost:5173/api/ranking
    → Vite proxy rewrites to http://localhost:8000/ranking
```

---

## 8. Why FastAPI Was Chosen

| Reason | Benefit for this project |
|--------|--------------------------|
| **Automatic OpenAPI/Swagger** | `/docs` for testing all endpoints during development |
| **Pydantic integration** | Request/response validation with clear error messages |
| **Async-ready** | Can scale to high concurrency if needed |
| **Type hints** | Better IDE support and fewer runtime bugs |
| **Dependency injection** | Clean `get_db`, `get_current_account` patterns |
| **Performance** | One of the fastest Python frameworks |
| **Modern Python stack** | Pairs naturally with SQLAlchemy 2.0 |

Alternatives considered:
- **Flask** — simpler but no built-in validation/docs
- **Django** — heavier for a focused REST API
- **Express (Node)** — good for JS teams but Python fits data/ranking logic well

---

## 9. Important Files Quick Reference

### Backend

| File | Purpose |
|------|---------|
| `main.py` | App entry, CORS, routers, global error handlers |
| `config.py` | DB URL, JWT secret, CORS origins |
| `database.py` | SQLAlchemy engine + session factory |
| `models/*.py` | Table definitions |
| `schemas/*.py` | API input/output shapes |
| `services/ranking_service.py` | Score calculation + leaderboard |
| `services/transaction_service.py` | Create transaction + duplicate handling |
| `services/auth_service.py` | Signup, login, JWT, bcrypt |
| `services/seed_service.py` | Demo data on first startup |
| `api/*.py` | Route definitions |
| `dependencies.py` | JWT Bearer authentication |

### Frontend

| File | Purpose |
|------|---------|
| `App.tsx` | Routes + auth guards |
| `context/AppContext.tsx` | Global state, auth, data loading |
| `lib/api.ts` | Axios client + JWT interceptor |
| `components/ProtectedRoute.tsx` | Redirect unauthenticated users to /login |
| `pages/*.tsx` | Feature screens |

---

## 10. Interview Questions & Answers

### Q1: Explain the architecture of your project.

**A:** It's a monorepo with a React frontend and FastAPI backend. The backend follows clean architecture: routes (`api/`) call services (`services/`) which use models (`models/`) for database access. Pydantic schemas validate all input/output. The frontend uses React Context for global state and Axios to call REST APIs through a Vite dev proxy.

---

### Q2: How does authentication work?

**A:** Users sign up with email/password. Passwords are hashed with bcrypt before storage. On login/signup, the server returns a JWT signed with HS256. The frontend stores it in localStorage and sends `Authorization: Bearer <token>` on each request. `/auth/me` validates the token and returns the current user. Protected frontend routes redirect to `/login` if no valid session.

---

### Q3: Why separate `accounts` and `users` tables?

**A:** `users` holds ranking profile data (score-related, transactions, avatar). `accounts` holds authentication credentials. This separation lets seeded demo users exist without login accounts, and keeps password hashes isolated from business data. New signups create both records  by `accounts.user_id`.

---

### Q4: How do you prevent duplicate transactions?

**A:** The `transaction_id` column has a UNIQUE database constraint. The service catches `IntegrityError` on commit and returns HTTP 409. Pydantic also validates field formats before the DB is touched. The frontend performs an optimistic duplicate check for better UX.

---

### Q5: Explain the ranking algorithm.

**A:** Scores combine five normalized factors (0–100): volume (35%), transaction count (20%), consistency/active days (20%), recency (15%), and type diversity (10%). The weighted sum is multiplied by 10 for the final integer score. Users are sorted descending; top 3 get gold/silver/bronze badges.

---

### Q6: What happens when validation fails?

**A:** Pydantic validation errors return 422 with a structured `errors` array. Business rule violations (future date, missing user) return 400 or 404 via `HTTPException`. The frontend displays `detail` from the API response in toast notifications.

---

### Q7: Why use SQLite?

**A:** Zero configuration, file-based, perfect for development and demos. SQLAlchemy abstracts the DB layer so switching to PostgreSQL in production requires only changing `database_url` in config.

---

### Q8: How does the frontend get data without mock files?

**A:** `AppContext.reloadData()` fetches `/ranking` and `/transactions` in parallel after authentication. All pages (`Dashboard`, `Leaderboard`, `History`, etc.) read from context state. Creating a transaction calls the API then reloads data.

---

### Q9: What is the role of Pydantic vs SQLAlchemy?

**A:** SQLAlchemy defines **database tables** and handles SQL. Pydantic defines **API contracts** — what JSON the client sends/receives. They serve different layers: ORM for persistence, Pydantic for validation/serialization.

---

### Q10: How would you deploy this to production?

**A:**
- Backend: Docker + Uvicorn/Gunicorn, PostgreSQL instead of SQLite, set `jwt_secret` via environment variable
- Frontend: `npm run build` → static files on Nginx/CDN
- Configure CORS for production domain
- Use HTTPS everywhere
- Add rate limiting on auth endpoints

---

### Q11: What improvements would you add next?

**A:** Server-side route protection with JWT on all endpoints, refresh tokens, password reset, pagination on `/transactions`, caching for `/ranking`, unit tests for ranking math, and Alembic migrations for schema changes.

---

### Q12: Explain the Vite proxy configuration.

**A:** In dev, the frontend runs on port 5173 and backend on 8000. Vite proxies `/api/*` to `localhost:8000`, stripping the `/api` prefix. This avoids CORS issues during development and lets Axios use a single base URL `/api`.

---

## 11. Running the Project

```bash
# Install dependencies
npm install
npm run install:frontend
pip install -r backend/requirements.txt

# Run both servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

---

*End of EXPLANATION.md*
