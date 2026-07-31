"""
Latency demo: fire ONE query, measure end-to-end wall-clock time,
and capture the polished LLM answer with per-stage timings.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, ".")
from run_test_queries import stream_message  # type: ignore
import requests

API = "http://localhost:8081"

DEMO = {
    "id": "DEMO_LATENCY",
    "query": (
        "Which active customers in our top revenue tier are based in "
        "regulated Asian markets, and who are their account managers? "
        "Sort by ARR descending."
    ),
    "clarification_answers": [
        # Round 1
        "Top revenue tier = Tier 1. Regulated Asian markets = India, Japan, "
        "South Korea, Singapore. Active = customers.status = 'Active'.",
        # Round 2 (defensive — in case classifier asks again)
        "For each customer return: customer_id, customer_name, country, "
        "arr_inr_lakhs, account manager full name (first + last), and "
        "account manager level. Sort by arr_inr_lakhs DESC.",
    ],
}


def main() -> None:
    print(f"\n{'=' * 70}")
    print(f"LATENCY DEMO — {DEMO['id']}")
    print(f"{'=' * 70}")
    print(f"\nUSER QUERY:\n  {DEMO['query']}\n")

    wall_t0 = time.monotonic()
    stage_log: list[tuple[str, float]] = []

    def stamp(label: str) -> None:
        stage_log.append((label, time.monotonic() - wall_t0))

    # Create session
    sess = requests.post(f"{API}/api/chat/session", timeout=120).json()
    thread_id = sess["thread_id"]
    stamp("session created")
    print(f"-> session opened (thread {thread_id[:8]})\n")

    # First user turn
    events = stream_message(thread_id, DEMO["query"])
    stamp("first response stream complete")
    all_events = list(events)

    ans_idx = 0
    while True:
        last = all_events[-1] if all_events else None
        if last is None:
            break
        ev = last["event"]
        if ev == "final":
            stamp("FINAL received")
            break
        if ev == "error":
            stamp("ERROR")
            print(f"\nERROR: {last['data'].get('message')}")
            break
        if ev == "clarification":
            ans = (
                DEMO["clarification_answers"][ans_idx]
                if ans_idx < len(DEMO["clarification_answers"])
                else "yes"
            )
            ans_idx += 1
            qtxt = last["data"].get("question", "")[:90]
            print(f"-> clarification: {qtxt}...")
            print(f"   answering   : {ans[:90]}...\n")
            events = stream_message(thread_id, ans)
            stamp(f"clarification round {ans_idx} done")
            all_events += events
            continue
        if ev == "readback":
            print(f"-> readback received -> auto-approving")
            events = stream_message(thread_id, {"approved": True})
            stamp("readback approved")
            all_events += events
            continue
        print(f"-> unknown event: {ev}; stopping")
        break

    total = time.monotonic() - wall_t0

    # Result
    final_ev = next((e for e in reversed(all_events) if e["event"] == "final"), None)
    final = (final_ev or {}).get("data") or {}
    answer = final.get("answer") or "(no answer)"
    conf = final.get("confidence")
    trace = final.get("trace") or []

    print(f"\n{'=' * 70}")
    print(f"LLM-POLISHED FINAL ANSWER (confidence={conf})")
    print(f"{'=' * 70}\n")
    try:
        print(answer)
    except UnicodeEncodeError:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
        print(answer)

    print(f"\n{'=' * 70}")
    print(f"TRACE")
    print(f"{'=' * 70}")
    print(" -> ".join(trace))

    print(f"\n{'=' * 70}")
    print(f"PER-STAGE TIMING (seconds from query firing)")
    print(f"{'=' * 70}")
    prev = 0.0
    for label, t in stage_log:
        delta = t - prev
        print(f"  {t:7.2f}s  (+{delta:5.2f}s)  {label}")
        prev = t
    print(f"\n{'=' * 70}")
    print(f"TOTAL WALL-CLOCK: {total:.2f} seconds  ({total / 60:.2f} min)")
    print(f"{'=' * 70}")

    # Persist
    out = Path("query_results") / "demo_latency.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(
        json.dumps(
            {
                "id": DEMO["id"],
                "query": DEMO["query"],
                "wall_clock_s": round(total, 2),
                "stage_timing": [{"label": l, "t_s": round(t, 2)} for l, t in stage_log],
                "confidence": conf,
                "trace": trace,
                "answer": answer,
            },
            indent=2,
            default=str,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\nSaved -> {out}")


if __name__ == "__main__":
    main()
