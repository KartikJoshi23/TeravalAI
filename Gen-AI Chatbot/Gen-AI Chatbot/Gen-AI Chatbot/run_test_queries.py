"""
Harness that fires a list of queries through the chatbot API, auto-answers
clarifications with the scripted answer, auto-approves read-backs, and
captures the final answer + full trace + citations for each.
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

import requests

API = "http://localhost:8081"

QUERIES = [
    {
        "id": "Q1",
        "query": (
            "Show me critical services where the owning team is behind on "
            "mandatory training and uses any flagged vendors. Include the "
            "training gap and the vendor names."
        ),
        "clarification_answers": [
            "Flagged vendors = risk_status in Conditional or Suspended (per Vendor_Contracts policy).",
            "Behind on mandatory training = the owning team has any employee whose mandatory training records are not Completed (Overdue, Not Started, or In Progress).",
        ],
    },
    {
        "id": "Q2",
        "query": (
            "What's our exposure if we wanted to lock in the engineers who "
            "handled all our serious incidents last year? Include both "
            "retention bonuses and what we paid them for being on-call."
        ),
        "clarification_answers": [
            "Serious incidents = SEV-1 and SEV-2. Last year = calendar year 2025.",
            "Engineers means any employee who was the incident reporter in Engineering, Information Security, or Site Reliability Engineering.",
            "Retention bonus = the maximum allowed retention bonus per the Salary_Structure policy (30% of CTC). On-call pay = per OnCall_Runbook stipend × the 8-week intensive response window after INC-2025-0847.",
        ],
    },
    {
        "id": "Q3",
        "query": (
            "We're heading into IPO. Which of our biggest accounts in "
            "regulated Asian markets are being managed by people who don't "
            "have ESOPs and haven't bothered with any certifications?"
        ),
        "clarification_answers": [
            "Biggest accounts = Tier 1. Regulated Asian markets = India, Japan, South Korea.",
            "No ESOPs = account manager level is below L5 (per Salary_Structure policy, ESOPs are granted only at L5 and above). Certifications = completed external certifications in training_compliance records (count of completed external certs = 0).",
        ],
    },
    {
        "id": "Q4",
        "query": (
            "Does our actual laptop spend on senior engineering staff line "
            "up with what's in Engineering's reported Q4 budget? Where's "
            "the gap, if any?"
        ),
        "clarification_answers": [
            "Senior engineering staff = active employees in the Engineering department at levels L4, L5, L6, L7, L8.",
            "Laptop spend = annual_cost from assets_licenses for asset_type Laptop issued to those employees. Compare against Engineering's reported Q4 budget in the Q4 Financial Report PDF and the Hardware Procurement lines in financial_transactions.",
        ],
    },
    {
        "id": "Q5",
        "query": (
            "We're scaling AI investment heavily next year — how much "
            "revenue do we have sitting in markets where data localization "
            "could blow up on us, and is our AI infrastructure even set up "
            "to handle that?"
        ),
        "clarification_answers": [
            "Markets at data-localization risk = Vietnam and Indonesia (per Board Minutes discussion of APAC data localization requirements).",
            "Revenue = sum of ARR of active customers in those countries. AI infrastructure = the GPU cluster described in Platform_Architecture and the FY26-27 AI/ML budget % from Product_Roadmap; compare against FY25-26 actual spend in financial_transactions for the Data & AI Research department.",
        ],
    },
]


def stream_message(thread_id: str, user_input) -> list[dict]:
    r = requests.post(
        f"{API}/api/chat/message",
        json={"thread_id": thread_id, "user_input": user_input},
        stream=True,
        timeout=1800,  # 30 min — handles enormous hybrid queries with Arbiter
    )
    r.raise_for_status()
    events: list[dict] = []
    ev_name = "message"
    data_parts: list[str] = []
    for line in r.iter_lines(decode_unicode=True):
        if line is None:
            continue
        if line == "":
            if data_parts:
                raw = "".join(data_parts)
                try:
                    events.append({"event": ev_name, "data": json.loads(raw)})
                except Exception:
                    pass
            ev_name = "message"
            data_parts = []
            continue
        if line.startswith("event: "):
            ev_name = line[7:].strip()
        elif line.startswith("data: "):
            data_parts.append(line[6:])
    # flush tail if the stream ended without a trailing blank
    if data_parts:
        raw = "".join(data_parts)
        try:
            events.append({"event": ev_name, "data": json.loads(raw)})
        except Exception:
            pass
    return events


def run_one(item: dict) -> dict:
    sess = requests.post(f"{API}/api/chat/session", timeout=120).json()
    thread_id = sess["thread_id"]
    print(f"\n=== {item['id']}: starting (thread={thread_id[:8]}) ===")
    print(f"Query: {item['query']}")
    events = stream_message(thread_id, item["query"])
    all_events = list(events)

    ans_idx = 0
    max_rounds = 10
    rounds = 0
    while rounds < max_rounds:
        rounds += 1
        last = all_events[-1] if all_events else None
        if last is None:
            break
        if last["event"] == "final":
            return {"id": item["id"], "thread_id": thread_id, "final": last["data"], "events": all_events}
        if last["event"] == "error":
            return {"id": item["id"], "thread_id": thread_id, "error": last["data"]["message"], "events": all_events}
        if last["event"] == "clarification":
            # Pick scripted answer; fall back to first option; else free-text "yes"
            if ans_idx < len(item["clarification_answers"]):
                answer = item["clarification_answers"][ans_idx]
                ans_idx += 1
            else:
                opts = last["data"].get("options") or []
                answer = opts[0]["label"] if opts else "yes"
            print(f"  -> clarification r{last['data'].get('round', rounds)}: '{last['data']['question'][:80]}...'")
            print(f"  -> answering: '{answer[:80]}...'")
            events = stream_message(thread_id, answer)
            all_events += events
            continue
        if last["event"] == "readback":
            print(f"  -> readback: '{last['data']['readback'][:100]}...'")
            print(f"  -> approving")
            events = stream_message(thread_id, {"approved": True})
            all_events += events
            continue
        # Trace or unknown: send a no-op? shouldn't happen
        print(f"  -> unexpected last event: {last['event']}; breaking")
        break
    return {"id": item["id"], "thread_id": thread_id, "events": all_events, "timed_out": True}


def summarise(result: dict) -> None:
    print(f"\n### {result['id']} — summary ###")
    if "error" in result:
        print(f"  ERROR: {result['error']}")
        return
    final = result.get("final") or {}
    trace = final.get("trace") or []
    conf = final.get("confidence")
    answer = final.get("answer") or ""
    ev = final.get("evidence") or {}
    cits = [c.get("chunk_id") for c in (ev.get("citations") or []) if c.get("chunk_id")]
    sql = (ev.get("sql") or {}).get("query") or ""
    rows = (ev.get("sql") or {}).get("rows_markdown") or ""

    print(f"  confidence: {conf}")
    print(f"  trace: {' -> '.join(trace)}")
    print(f"  citations: {sorted(set(cits))}")
    print(f"\n--- ANSWER ---\n{answer}\n")
    if sql:
        print(f"--- SQL (first 900 chars) ---\n{sql[:900]}\n")
    if rows:
        rlines = rows.strip().split("\n")
        print(f"--- ROWS (first 30 of {len(rlines)}) ---")
        for rl in rlines[:30]:
            print(rl)


def main():
    out_dir = Path("query_results")
    out_dir.mkdir(exist_ok=True)
    results = []
    for q in QUERIES:
        t0 = time.monotonic()
        try:
            r = run_one(q)
        except Exception as e:
            r = {"id": q["id"], "error": str(e)}
        r["elapsed_s"] = round(time.monotonic() - t0, 1)
        results.append(r)
        with open(out_dir / f"{q['id']}.json", "w", encoding="utf-8") as f:
            json.dump(r, f, indent=2, default=str, ensure_ascii=False)
        try:
            summarise(r)
        except UnicodeEncodeError:
            print(f"  (summary contained non-ASCII; JSON saved to {q['id']}.json)")
        print(f"  elapsed: {r['elapsed_s']}s")

    # Final combined report
    with open(out_dir / "all.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str, ensure_ascii=False)
    print("\n\n=== ALL DONE ===")
    for r in results:
        status = "ERROR" if "error" in r else ("TIMEOUT" if r.get("timed_out") else "OK")
        conf = (r.get("final") or {}).get("confidence")
        n_cits = len({c.get("chunk_id") for c in ((r.get("final") or {}).get("evidence", {}).get("citations") or [])})
        print(f"  {r['id']:4s} {status:8s} conf={conf}  citations={n_cits}  elapsed={r.get('elapsed_s')}s")


if __name__ == "__main__":
    main()
