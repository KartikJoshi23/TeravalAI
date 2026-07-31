"""Audit-IPO-blocker query — exercises new audit_findings table + new ISMS_Policy PDF."""

import json, sys
sys.path.insert(0, ".")
from run_test_queries import run_one

Q = {
    "id": "AUDIT_IPO_BLOCKER",
    "query": (
        "Which audit findings are currently flagged as IPO blockers? "
        "For each one, tell me the finding summary, severity, the audit "
        "engagement it came from, the department that owns it, the assigned "
        "owner, and what the ISMS policy says about the type of control that "
        "finding relates to."
    ),
    "clarification_answers": [
        # Round 1
        "IPO blockers = ALL rows in audit_findings where ipo_blocker_flag = 'Yes' AND "
        "status IN ('Open', 'In Progress'). Return EVERY such row — DO NOT filter further "
        "to 'latest' or 'most recent'. Use ORDER BY (not WHERE) for severity ordering: "
        "ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, "
        "report_date DESC. We expect 3-6 rows.",
        # Round 2
        "For each finding row, JOIN to departments on department_id and to employees on "
        "assigned_owner_employee_id. Include in the SELECT: finding_id, audit_engagement, "
        "severity, finding_summary, finding_category, department_name, assigned_owner name, "
        "due_date, status. The ISMS policy excerpt should be looked up by finding_category "
        "(Vulnerability, Data Handling, Access Management, etc.) using sections of "
        "TechNova_ISMS_Policy.pdf.",
    ],
}

r = run_one(Q)
with open("query_results/audit_ipo_blocker.json", "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, default=str, ensure_ascii=False)

final = r.get("final") or {}
print("\n=== FINAL ===\n")
try:
    print(final.get("answer") or "(no final)")
except UnicodeEncodeError:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    print(final.get("answer") or "(no final)")
print("\nconfidence:", final.get("confidence"))
print("trace:", " -> ".join(final.get("trace") or []))
