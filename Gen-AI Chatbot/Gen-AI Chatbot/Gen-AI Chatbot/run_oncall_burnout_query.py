"""On-call burnout query — exercises oncall_rotations + incidents + employees +
salary_records + departments + OnCall_Runbook PDF + Salary_Structure PDF."""

import json, sys
sys.path.insert(0, ".")
from run_test_queries import run_one

Q = {
    "id": "ONCALL_BURNOUT",
    "query": (
        "Identify the engineers who are at the highest burnout risk based "
        "on the last 24 weeks of on-call rotations AND were also incident "
        "reporters during 2025. For each, show their cumulative on-call "
        "stipend earnings, total pages received, and incident count. What "
        "does the OnCall Runbook say about burnout / response-time SLAs, "
        "and what would it cost to lock the top 3 in via the standard "
        "retention policy?"
    ),
    "clarification_answers": [
        # Round 1
        "Definitions:\n"
        "- 'Burnout risk' = SUM(oncall_rotations.burnout_risk_score) over the last 24 "
        "rotation weeks per employee (the data already covers 24 weeks).\n"
        "- 'Engineer' = any employee who appears in oncall_rotations.\n"
        "- 'Incident reporters during 2025' = engineer's employee_id appears in "
        "incidents.reporter_employee_id AND CAST(incidents.reported_date AS DATE) "
        "BETWEEN '2025-01-01' AND '2025-12-31'.\n"
        "- 'Cumulative on-call stipend' = SUM(weekly_stipend_inr) + SUM(holiday_premium_paid_inr) "
        "across all rotations for that engineer.\n"
        "- 'Total pages received' = SUM(pages_received_count).\n"
        "- 'Top 3' = top 3 engineers by cumulative_burnout_score after filtering to "
        "incident reporters.\n"
        "- 'Lock in via standard retention policy' = 30% of total_ctc_inr_lakhs from the "
        "latest salary_records row per employee, summed across the top 3.",
        # Round 2
        "Return ALL qualifying engineers ordered by cumulative_burnout_score DESC. "
        "We expect 5-15 rows. For each engineer include: employee_id, name, level, "
        "department_name, cumulative_burnout_score, total_pages_received, "
        "total_incidents_2025, total_stipend_paid_inr, retention_bonus_30pct_ctc_inr_lakhs. "
        "Then separately compute the top-3 retention liability and cite the OnCall_Runbook "
        "and Salary_Structure PDFs for the policy basis.",
    ],
}

r = run_one(Q)
with open("query_results/oncall_burnout.json", "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, default=str, ensure_ascii=False)
final = r.get("final") or {}
print("\n=== FINAL ===\n")
try:
    print(final.get("answer") or "(no final)")
except UnicodeEncodeError:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print(final.get("answer") or "(no final)")
print("\nconf:", final.get("confidence"))
print("trace:", " -> ".join(final.get("trace") or []))
