"""OpenAI client factory, pointed at NVIDIA NIM.

Kept deliberately close to the provided Gen-AI Chatbot's `llm.py`: NIM exposes an
OpenAI-compatible API, so the only changes are the `base_url`, the key, and the
model name. Everything downstream uses the standard OpenAI client interface.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


def _make_client() -> Any:
    settings = get_settings()
    if not settings.nvidia_nim_api_key:
        raise RuntimeError(
            "NVIDIA_NIM_API_KEY is not set. Copy assistant/.env.example to "
            "assistant/.env, paste the NIM key, and restart the backend."
        )
    from openai import OpenAI

    logger.info("Creating NIM (OpenAI-compatible) client at %s", settings.nim_base_url)
    # timeout: a hung NIM connection should surface as a clean SSE `error` (and
    # the frontend's offline fallback) in about a minute, not the SDK's default
    # 600 s of a stuck "…thinking" state.
    return OpenAI(api_key=settings.nvidia_nim_api_key, base_url=settings.nim_base_url, timeout=60)


@lru_cache(maxsize=1)
def get_client() -> Any:
    return _make_client()


def get_model_name() -> str:
    return get_settings().nim_model
