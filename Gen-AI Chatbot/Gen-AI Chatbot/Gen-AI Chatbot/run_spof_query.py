"""Fire the Manager SPOF query."""

import json
import sys

sys.path.insert(0, ".")
from run_test_queries import run_one

Q = {
    "id": "MANAGER_SPOF",
    "query": (
        "Which of our managers are the biggest single-points-of-failure "
        "right now? I want to see — for each one — how many people report "
        "up to them, how much customer revenue is sitting under their "
        "decisions, how many serious incidents have come out of their team, "
        "and whether there's actually anyone vested enough and ready to "
        "take over if they walked tomorrow. Rank them."
    ),
    "clarification_answers": [
        # Round 1 — what counts as a manager, scope of reports, etc.
        "A 'manager' is any employee who has at least one direct report in "
        "employees.manager_employee_id (i.e. who appears as a manager_employee_id "
        "for at least one other employee). Include ALL such managers, not just "
        "senior leaders. 'People report up to them' = direct reports + "
        "transitive reports down the manager chain (recursive). Resolve this "
        "via a recursive CTE in DuckDB.",
        # Round 2 — meaning of each metric
        "For each manager, compute: "
        "(a) total_team_size = count of direct + indirect reports via recursive manager chain; "
        "(b) customer_arr_under_team = SUM(customers.arr_inr_lakhs) for Active "
        "customers whose account_manager_employee_id is in the manager's transitive team (not including the manager themselves); "
        "(c) serious_incidents_from_team = COUNT(*) of incidents in calendar 2025 "
        "where incidents.severity IN ('SEV-1','SEV-2') and incidents.reporter_employee_id is in the manager's transitive team; "
        "(d) ready_successor = 1 if at least one direct or indirect report has "
        "esop_units_granted > 0 AND performance_rating IN ('Exceeds','Meets Expectations','Meets') AND level >= L4, else 0. "
        "Rank by a composite SPOF score = team_size + (customer_arr_under_team/100) + (serious_incidents_from_team * 5), desc. Show the top 10.",
        # Round 3 — if system asks about anything else
        "Use the latest salary_records row per employee for esop_units_granted and performance_rating. Ignore inactive or terminated employees.",
    ],
}

r = run_one(Q)
with open("query_results/manager_spof.json", "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, default=str, ensure_ascii=False)

final = r.get("final") or {}
print("\n================ FINAL ================\n")
try:
    print(final.get("answer") or "(no final answer)")
except UnicodeEncodeError:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print(final.get("answer") or "(no final answer)")
print("\nconfidence:", final.get("confidence"))
print("trace:", " -> ".join(final.get("trace") or []))
