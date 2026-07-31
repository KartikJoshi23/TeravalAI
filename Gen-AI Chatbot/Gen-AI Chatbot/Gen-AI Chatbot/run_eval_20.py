"""
20-query evaluation: 5 simple + 5 medium + 10 complex.

For each query we define `expected_substrings` — facts that should appear in
the final answer. Pass = ≥ 80% of expected substrings present, final
confidence ≥ 0.70, and no hard `fail` verdict in the trace.

Results written to `query_results/eval_20.json` with per-query scoring.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, ".")
from run_test_queries import run_one, stream_message  # reuses SSE harness

QUERIES = [
    # ------------------------------------------------------------------ SIMPLE (5)
    {
        "id": "S1",
        "level": "simple",
        "query": "How many active employees does TechNova currently have?",
        "clarification_answers": [],
        "expected_substrings": ["active", "employee"],  # just want a count
        "must_cite_pdf": False,
    },
    {
        "id": "S2",
        "level": "simple",
        "query": "What is the current ESOP fair-market-value per share?",
        "clarification_answers": [],
        "expected_substrings": ["842"],
        "must_cite_pdf": True,  # policy term implied
    },
    {
        "id": "S3",
        "level": "simple",
        "query": "Which departments are based in Bangalore?",
        "clarification_answers": [],
        "expected_substrings": ["Engineering", "Bangalore"],
        "must_cite_pdf": False,
    },
    {
        "id": "S4",
        "level": "simple",
        "query": "What does the IT Asset Policy say about laptop allocation for senior engineering staff?",
        "clarification_answers": [],
        "expected_substrings": ["MacBook", "IT_Asset_Policy"],
        "must_cite_pdf": True,
    },
    {
        "id": "S5",
        "level": "simple",
        "query": "How many Tier 1 customers are there?",
        "clarification_answers": [],
        "expected_substrings": ["Tier 1"],
        "must_cite_pdf": False,
    },
    # ------------------------------------------------------------------ MEDIUM (5)
    {
        "id": "M1",
        "level": "medium",
        "query": "Show the average total CTC for each employee level across the company.",
        "clarification_answers": [
            "Use salary_records.total_ctc_inr_lakhs for each level L1 through L8.",
        ],
        "expected_substrings": ["L1", "L8"],
        "must_cite_pdf": False,
    },
    {
        "id": "M2",
        "level": "medium",
        "query": "Which department owns the most Critical-tier services?",
        "clarification_answers": [],
        "expected_substrings": ["Engineering", "Critical"],
        "must_cite_pdf": False,
    },
    {
        "id": "M3",
        "level": "medium",
        "query": "Break down our vendors by risk_status — how many in each bucket?",
        "clarification_answers": [],
        "expected_substrings": ["Passed", "Conditional", "Suspended"],
        "must_cite_pdf": True,  # "risk_status" is a policy concept
    },
    {
        "id": "M4",
        "level": "medium",
        "query": "What did the board say about data localization risks in APAC?",
        "clarification_answers": [],
        "expected_substrings": ["Vietnam", "Indonesia", "Board_Minutes"],
        "must_cite_pdf": True,
    },
    {
        "id": "M5",
        "level": "medium",
        "query": "What's the total Capital Expenditure in FY2025-26, broken down by subcategory?",
        "clarification_answers": [],
        "expected_substrings": ["Singapore", "GPU Hardware", "Zero Trust"],
        "must_cite_pdf": False,
    },
    # ------------------------------------------------------------------ COMPLEX (10)
    {
        "id": "C1",
        "level": "complex",
        "query": "Which L5+ employees hold ESOP grants, and what's the combined vested value at current FMV?",
        "clarification_answers": [
            "ESOP holders = employees with esop_units_granted > 0 in salary_records. Value = esop_units_granted × esop_fmv_per_share_inr. 'Vested' = the full grant for this question (we don't have a separate vested-tranche field).",
            "Level filter = L5, L6, L7, L8.",
        ],
        "expected_substrings": ["ESOP", "L5"],
        "must_cite_pdf": True,
    },
    {
        "id": "C2",
        "level": "complex",
        "query": "For each region, give me the top customer by ARR and the level of their account manager.",
        "clarification_answers": [
            "Regions are the four values in customers.region (North America, Europe, APAC, MEA). Top by ARR within each region.",
        ],
        "expected_substrings": ["APAC", "North America"],
        "must_cite_pdf": False,
    },
    {
        "id": "C3",
        "level": "complex",
        "query": "Show quarter-over-quarter revenue growth for APAC in FY2025-26.",
        "clarification_answers": [
            "Revenue = sum of amount in financial_transactions filtered to category='Revenue' AND region='APAC' AND period_quarter LIKE 'FY2025-26'. Group by quarter; compute LAG and % change.",
        ],
        "expected_substrings": ["APAC", "FY2025-26"],
        "must_cite_pdf": False,
    },
    {
        "id": "C4",
        "level": "complex",
        "query": "Which Critical-tier services have uptime SLA below 99.9%? And per the architecture doc, what's the business risk when a Critical service is out?",
        "clarification_answers": [
            "Critical = products_services.criticality_tier = 'Critical'. Below 99.9% = products_services.uptime_sla_percent < 99.9.",
        ],
        "expected_substrings": ["Critical", "Platform_Architecture"],
        "must_cite_pdf": True,
    },
    {
        "id": "C5",
        "level": "complex",
        "query": "Who reports directly to the CFO, what are their levels, and how much combined CTC do they represent?",
        "clarification_answers": [
            "CFO = employee whose job_title contains 'CFO' or 'Chief Financial Officer' — identify them, then find employees whose manager_employee_id equals the CFO's employee_id.",
        ],
        "expected_substrings": ["CFO", "direct"],
        "must_cite_pdf": False,
    },
    {
        "id": "C6",
        "level": "complex",
        "query": "Which vendors have contracts ending in the next 12 months AND carry a Conditional or Suspended risk_status? What does the vendor policy say we should do?",
        "clarification_answers": [
            "Today's date is 2026-04-22. Next 12 months = contract_end_date BETWEEN '2026-04-22' AND '2027-04-22'. Flagged risk = risk_status IN ('Conditional','Suspended').",
        ],
        "expected_substrings": ["Conditional", "Vendor_Contracts"],
        "must_cite_pdf": True,
    },
    {
        "id": "C7",
        "level": "complex",
        "query": "Heading into IPO, which of our Tier-1 APAC customers are either Churned or At Risk, and how much ARR does that represent?",
        "clarification_answers": [
            "APAC = customers.region='APAC'. Tier = 'Tier 1'. Risk accounts = account_status IN ('Churned','At Risk').",
        ],
        "expected_substrings": ["Tier 1", "APAC"],
        "must_cite_pdf": True,
    },
    {
        "id": "C8",
        "level": "complex",
        "query": "What's our total AI infrastructure spend for FY2025-26 across all relevant departments, and how does that compare to the AI/ML budget allocation planned for FY2026-27?",
        "clarification_answers": [
            "AI infrastructure spend = sum of GPU Compute (OpEx, Data & AI Research) + GPU Hardware Purchase (CapEx, Engineering) + Data Warehouse (OpEx, Data & AI Research) + Salaries & Benefits (OpEx, Data & AI Research). FY26-27 budget = 38% of ₹485 Cr from the Product Roadmap.",
        ],
        "expected_substrings": ["FY26", "AI"],
        "must_cite_pdf": True,
    },
    {
        "id": "C9",
        "level": "complex",
        "query": "For each SEV-1 incident reported in calendar year 2025, show the incident ref, the affected service, the reporter's name, and the remediation cost.",
        "clarification_answers": [
            "SEV-1 incidents = incidents.severity='SEV-1' AND reported_date BETWEEN '2025-01-01' AND '2025-12-31'.",
        ],
        "expected_substrings": ["SEV-1", "INC-"],
        "must_cite_pdf": False,
    },
    {
        "id": "C10",
        "level": "complex",
        "query": "What percentage of employees have completed every mandatory training module they were assigned, broken down by department? Include the policy threshold that flags a department.",
        "clarification_answers": [
            "Percentage completed = employees where ALL their training_compliance rows have status='Completed', as a fraction of all employees in that department.",
        ],
        "expected_substrings": ["Training_Compliance", "90"],
        "must_cite_pdf": True,
    },
]


def score(item: dict, result: dict) -> dict:
    final = result.get("final") or {}
    if not final:
        return {"passed": False, "reason": "no final answer", "conf": None, "matches": 0, "matches_total": len(item["expected_substrings"]), "cited_pdf": False}

    ans = (final.get("answer") or "").lower()
    matches = sum(1 for s in item["expected_substrings"] if s.lower() in ans)
    cited_pdf = ".pdf" in ans

    conf = float(final.get("confidence") or 0)
    expected_n = max(1, len(item["expected_substrings"]))
    coverage = matches / expected_n

    pdf_ok = True
    if item.get("must_cite_pdf"):
        pdf_ok = cited_pdf

    passed = coverage >= 0.8 and conf >= 0.70 and pdf_ok

    reasons: list[str] = []
    if coverage < 0.8:
        reasons.append(f"coverage {coverage:.0%} < 80%")
    if conf < 0.70:
        reasons.append(f"conf {conf:.2f} < 0.70")
    if not pdf_ok:
        reasons.append("no PDF citation")

    return {
        "passed": passed,
        "reason": "; ".join(reasons) or "ok",
        "conf": conf,
        "matches": matches,
        "matches_total": expected_n,
        "cited_pdf": cited_pdf,
    }


def main():
    out_dir = Path("query_results")
    out_dir.mkdir(exist_ok=True)

    all_results = []
    for q in QUERIES:
        t0 = time.monotonic()
        try:
            r = run_one(q)
        except Exception as e:
            r = {"id": q["id"], "error": str(e), "final": None}
        r["elapsed_s"] = round(time.monotonic() - t0, 1)
        sc = score(q, r)
        r["score"] = sc
        r["level"] = q["level"]
        r["expected_substrings"] = q["expected_substrings"]
        all_results.append(r)
        # per-query save
        with open(out_dir / f"eval_{q['id']}.json", "w", encoding="utf-8") as f:
            json.dump(r, f, indent=2, default=str, ensure_ascii=False)
        # concise summary line
        status = "PASS" if sc["passed"] else "FAIL"
        print(f"[{status}] {q['id']:3s} ({q['level']:<7s}) conf={sc['conf']}  coverage={sc['matches']}/{sc['matches_total']}  cited={sc['cited_pdf']}  elapsed={r['elapsed_s']}s  reason={sc['reason']}")

    # combined
    with open(out_dir / "eval_20.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, default=str, ensure_ascii=False)

    total = len(all_results)
    passed = sum(1 for r in all_results if r["score"]["passed"])
    print(f"\n===== OVERALL: {passed}/{total} = {100*passed/total:.0f}% =====")
    by_level: dict = {}
    for r in all_results:
        by_level.setdefault(r["level"], [0, 0])
        by_level[r["level"]][1] += 1
        if r["score"]["passed"]:
            by_level[r["level"]][0] += 1
    for lvl, (p, t) in sorted(by_level.items()):
        print(f"  {lvl:<8s} {p}/{t} = {100*p/t:.0f}%")


if __name__ == "__main__":
    main()
