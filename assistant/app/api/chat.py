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


# --- Scope guardrail (defence-in-depth; the system prompt in prompts.py is the
# primary guard, this just avoids paying for a NIM call on blatant off-topic abuse).
_REFUSAL = (
    "I'm the Teraval finance assistant — I can only help with this Barq AI "
    "capital-budgeting appraisal. Try asking about NPV, break-even, scenarios, "
    "or the recommendation."
)
_FINANCE_KEYWORDS = {
    "npv", "irr", "mirr", "wacc", " pi", "profitab", "break", "even", "cost", "price",
    "risk", "invest", "capex", "capital", "gpu", "scenario", "sensitiv", "tornado",
    "monte", "carlo", "board", "ethic", "recommend", "payback", "cash", "flow", " eac",
    "rent", "build", "tariff", "pue", "utiliz", "forecast", "value", "discount", "margin",
    "offtake", "refresh", "depreciat", "tax", "decision", "verdict", "assumption", "barq",
    "data cent", "hall", "project", "model", "accept", "reject", "hurdle", "return",
    "profit", "loss", "revenue", "money", "worth", "spend", "summary", "kpi", "chart",
}

# Hard-block: phrases that are NEVER a legitimate appraisal question, even when a
# finance word co-occurs — e.g. "write Python code to compute the NPV" (contains
# "npv"), or "capital of France" (contains "capital"). Without this, such requests
# slip past the finance-keyword allow-list and the model answers them. Mirrors the
# frontend STRONG_OFFTOPIC list in web/src/lib/assistantFallback.ts.
_STRONG_OFFTOPIC = {
    "python", "javascript", "typescript", " java ", "c++", "c#", "sql", "programming",
    "write code", "source code", "write a program", "leetcode", "recipe",
    "how to cook", "capital of", "capital city", "tell me a joke", "write me a poem",
    "write me an essay", "write a poem", "write a song", "meaning of life",
    "weather in", "who won", "translate ",
}


def _off_topic(question: str) -> bool:
    """True when a question is out of scope for the appraisal assistant."""
    q = question.strip().lower()
    # Hard block first: never-legitimate topics, even wrapped around a finance word.
    if any(k in q for k in _STRONG_OFFTOPIC):
        return True
    if len(q) <= 10:  # let short greetings ("hi", "thanks") reach the model
        return False
    # Otherwise, in scope only if it mentions something finance/project-related.
    return not any(k in q for k in _FINANCE_KEYWORDS)


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
        # Guardrail: refuse blatant off-topic questions without calling the LLM.
        if _off_topic(req.question):
            yield _sse("final", {"answer": _REFUSAL})
            return
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
