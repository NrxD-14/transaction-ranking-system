# Transaction Ranking System — FastAPI Backend

Created by Narayan.

> See [../EXPLANATION.md](../EXPLANATION.md) for full architecture, API docs, and interview Q&A.

## Stack

- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- CORS enabled for the React frontend

## Project structure

```
backend/
├── app/
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── database.py
│   ├── config.py
│   └── main.py
├── requirements.txt
└── README.md
```

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

From the project root you can also run:

```bash
npm run dev:backend
```

## API docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Create account and ranking profile |
| POST | `/auth/login` | Sign in and receive JWT |
| GET | `/auth/me` | Current user (Bearer token required) |
| POST | `/transaction` | Create a transaction (unique `transactionId`) |
| GET | `/summary/{userId}` | User summary with score breakdown |
| GET | `/ranking` | Ranked users using multi-factor scoring |
| GET | `/users` | All users with computed ranks (frontend support) |
| GET | `/transactions` | All transactions (frontend support) |
| GET | `/health` | Health check |

## Ranking algorithm

Each user score combines:

- **Volume** (35%) — total transaction amount
- **Count** (20%) — number of transactions
- **Consistency** (20%) — unique active days
- **Recency** (15%) — days since last transaction
- **Diversity** (10%) — unique transaction types

Badges: gold (#1), silver (#2), bronze (#3).
