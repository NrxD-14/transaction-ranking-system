"""FastAPI application entry point — Transaction Ranking System.

Created by Narayan Dev. Creates the app, registers CORS, mounts all API routers,
and defines global exception handlers. On startup, creates SQLite tables and seeds demo data.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import admin, auth, chat, data, ranking, summary, transaction
from app.config import settings
from app.database import Base, SessionLocal, engine, ensure_schema
from app.services.seed_service import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables if missing, then seed 30 demo users + 180 transactions
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FastAPI backend for transaction ranking.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Validation failed", "errors": exc.errors()},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(_: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Database operation failed", "detail": str(exc.__class__.__name__)},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Unexpected server error", "detail": str(exc)},
    )


app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(transaction.router)
app.include_router(chat.router)
app.include_router(summary.router)
app.include_router(ranking.router)
app.include_router(data.router)
