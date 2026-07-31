"""Teraval AI Finance Assistant — FastAPI entrypoint.

Run:  cd assistant && uvicorn app.main:app --reload --port 8000
"""
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.api.chat import router as chat_router
from app.config import get_settings

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

settings = get_settings()

app = FastAPI(title="Teraval AI Finance Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    model: str
    nim_configured: bool


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model=settings.nim_model,
        nim_configured=bool(settings.nvidia_nim_api_key),
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "Teraval AI Finance Assistant",
        "chat": "POST /api/chat/message  (SSE: token / final / error)",
        "docs": "/docs",
    }


app.include_router(chat_router)
