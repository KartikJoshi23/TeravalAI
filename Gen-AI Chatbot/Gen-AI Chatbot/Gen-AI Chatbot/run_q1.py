import json
import sys

sys.path.insert(0, ".")
from run_test_queries import run_one, summarise

Q1 = {
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
}

r = run_one(Q1)
with open("query_results/Q1.json", "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, default=str, ensure_ascii=False)
try:
    summarise(r)
except UnicodeEncodeError:
    print("(summary contained non-ASCII; JSON written successfully)")
