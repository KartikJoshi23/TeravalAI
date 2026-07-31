"""Sales-pipeline-risk query — exercises sales_pipeline + customer_contracts +
product_feature_adoption + audit_findings + employees + departments."""

import json, sys
sys.path.insert(0, ".")
from run_test_queries import run_one

Q = {
    "id": "SALES_PIPELINE_RISK",
    "query": (
        "Which Account Executives have the highest weighted-pipeline ACV "
        "right now AND own existing customer relationships where contracts "
        "come up for renewal in the next 12 months AND have at least one "
        "feature flagged as churn-risk on those customers? Also tell me if "
        "any of their owning departments are currently hosting open IPO-"
        "blocker audit findings. Rank by weighted pipeline ACV."
    ),
    "clarification_answers": [
        # Round 1
        "Definitions:\n"
        "- 'Account Executive' = employees referenced as account_executive_employee_id "
        "in sales_pipeline (any level).\n"
        "- 'Highest weighted-pipeline ACV' = SUM(sales_pipeline.weighted_acv_inr_lakhs) "
        "for that AE across stages NOT IN ('Closed-Won','Closed-Lost'), i.e. only "
        "open opportunities.\n"
        "- 'Existing customer relationships' = the AE is also the account_manager_employee_id "
        "for at least one customer in the customers table.\n"
        "- 'Contracts come up for renewal in the next 12 months' = customer_contracts.expiry_date "
        "BETWEEN '2026-04-26' AND '2027-04-26', for any contract belonging to that AE's customers.\n"
        "- 'Feature flagged as churn-risk' = product_feature_adoption.churn_risk_flag = 'Yes' "
        "for at least one feature on at least one of the AE's customers.\n"
        "- 'Owning department open IPO-blocker' = audit_findings.ipo_blocker_flag = 'Yes' "
        "AND status IN ('Open','In Progress'), where audit_findings.department_id matches "
        "the AE's employees.department_id.\n"
        "Return ALL matching AEs ordered by weighted_pipeline_acv DESC. We expect 2-8 rows.",
        # Round 2
        "For each AE in the result, include: employee_id, AE name (first + last), AE level, "
        "AE department_name (joined via departments), weighted_pipeline_acv_inr_lakhs, "
        "open_opportunity_count, account_count (number of customers they manage), "
        "customers_with_renewal_in_12m_count, churn_risk_features_count, and "
        "department_has_ipo_blocker (Yes/No). Use a CTE-per-metric pattern.",
    ],
}

r = run_one(Q)
with open("query_results/sales_pipeline_risk.json", "w", encoding="utf-8") as f:
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
