import json
import sys

sys.path.insert(0, ".")
from run_test_queries import QUERIES, run_one, summarise

q5 = [q for q in QUERIES if q["id"] == "Q5"][0]
r = run_one(q5)
with open("query_results/Q5.json", "w", encoding="utf-8") as f:
    json.dump(r, f, indent=2, default=str, ensure_ascii=False)
summarise(r)
