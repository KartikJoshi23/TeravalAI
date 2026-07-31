"""/api/chat — the Teraval assistant endpoint.

Simplified from the provided chatbot's agentic SSE contract: no sessions, no
interrupts, no SQL/RAG graph. One POST streams the NIM completion back as SSE
events (`token` deltas, then a `final`, or an `error`). The grounded model state
travels in the request body, so the LLM only narrates.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Iterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.llm import get_client, get_model_name
from app.prompts import build_system_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class MessageRequest(BaseModel):
    question: str
    context: dict[str, Any] = {}
    history: list[ChatTurn] = []


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


def _build_messages(req: MessageRequest) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [
        {"role": "system", "content": build_system_prompt(req.context)}
    ]
    for turn in req.history[-8:]:  # keep the last few turns for context
        role = turn.role if turn.role in ("user", "assistant") else "user"
        messages.append({"role": role, "content": turn.content})
    messages.append({"role": "user", "content": req.question})
    return messages


@router.post("/message")
def post_message(req: MessageRequest) -> StreamingResponse:
    # A sync generator: FastAPI runs it in a threadpool, so iterating the
    # (blocking) OpenAI/NIM stream here does not stall the event loop.
    def gen() -> Iterator[str]:
        try:
            client = get_client()
            stream = client.chat.completions.create(
                model=get_model_name(),
                messages=_build_messages(req),
                temperature=0.2,
                max_tokens=700,
                stream=True,
            )
            parts: list[str] = []
            for chunk in stream:
                choices = getattr(chunk, "choices", None)
                if not choices:
                    continue
                delta = getattr(choices[0].delta, "content", None) or ""
                if delta:
                    parts.append(delta)
                    yield _sse("token", {"text": delta})
            yield _sse("final", {"answer": "".join(parts)})
        except Exception as e:  # noqa: BLE001
            logger.exception("chat completion failed")
            yield _sse("error", {"message": str(e)})

    return StreamingResponse(gen(), media_type="text/event-stream")
