"""Fire the IPO-breach-blast-radius query, auto-answer clarifications,
capture the full final answer."""

import json
import sys

sys.path.insert(0, ".")
from run_test_queries import run_one

Q = {
    "id": "IPO_BREACH",
    "query": (
        "If last November's breach happened again tomorrow but on one of our "
        "critical AI services instead, what would it actually cost us end-to-"
        "end — including the people we'd need to lock in, the customers we'd "
        "probably lose, the vendor contracts that could fall apart, the "
        "regulatory and legal bill, and whether we even have enough unspent "
        "budget to absorb it before we file for the IPO? Basically, is a "
        "breach right now a threat to the IPO timeline?"
    ),
    "clarification_answers": [
        # Round 1: November breach reference
        "'Last November's breach' = INC-2025-0847 (the November 2025 security breach described in the Security Incident Report). Use its severity, affected customers, and remediation cost as the baseline; scale up if the scenario lands on a Critical AI service. 'Critical AI services' = products_services with criticality_tier='Critical' AND domain in ('AI Services','Analytics Engine') OR service_name LIKE '%ai%' / '%ml%' / '%analytics%'.",
        # Round 2: scope of each cost bucket
        "People to lock in = the incident reporters plus the on-call engineers responsible for those AI services, with retention cost = 30% of their CTC per the Salary_Structure policy. Customers we'd lose = Tier-1 and Tier-2 customers with exposure to the affected service (use customers_affected_count from incidents and regional ARR as a proxy); assume 15% churn risk of ARR. Vendor contracts = vendors with risk_status Conditional or Suspended that are owned by the affected department. Regulatory/legal = use the remediation_cost_inr_lakhs from INC-2025-0847 as the direct regulatory baseline, plus the additional 8.5 crores Zero Trust budget from the board minutes as an indicative floor. Budget headroom = Engineering's remaining unspent Q4 budget per the Q4 Financial Report, compared against the total scenario cost. IPO timeline = the DRHP filing date from Board_Minutes §3.",
    ],
}

r = run_one(Q)
with open("query_results/ipo_breach.json", "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, default=str, ensure_ascii=False)

final = r.get("final") or {}
print("\n\n================ FINAL ANSWER ================\n")
try:
    print(final.get("answer") or "(no final answer)")
except UnicodeEncodeError:
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print(final.get("answer") or "(no final answer)")
print("\n\nconfidence:", final.get("confidence"))
print("trace:", " -> ".join(final.get("trace") or []))
