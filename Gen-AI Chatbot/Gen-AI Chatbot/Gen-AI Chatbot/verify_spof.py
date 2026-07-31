"""Independent ground-truth verification of the Manager SPOF query."""

import sys
import io
import duckdb

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

con = duckdb.connect("data/db/technova.duckdb", read_only=True)

# Re-run the same recursive-CTE pipeline the agent generated.
SQL = """
WITH RECURSIVE manager_reports AS (
    SELECT manager_employee_id AS manager_id, employee_id AS report_id, 1 AS depth
    FROM employees WHERE manager_employee_id IS NOT NULL
    UNION ALL
    SELECT mr.manager_id, e.employee_id, mr.depth + 1
    FROM manager_reports mr
    JOIN employees e ON e.manager_employee_id = mr.report_id
),
team_metrics AS (
    SELECT manager_id, COUNT(DISTINCT report_id) AS total_team_size
    FROM manager_reports GROUP BY manager_id
),
customer_metrics AS (
    SELECT mr.manager_id, COALESCE(SUM(c.arr_inr_lakhs),0) AS customer_arr_under_team
    FROM manager_reports mr
    LEFT JOIN customers c
      ON c.account_manager_employee_id = mr.report_id
     AND c.account_status = 'Active'
    GROUP BY mr.manager_id
),
incident_metrics AS (
    SELECT mr.manager_id, COUNT(i.incident_id) AS serious_incidents_from_team
    FROM manager_reports mr
    LEFT JOIN incidents i
      ON i.reporter_employee_id = mr.report_id
     AND i.severity IN ('SEV-1','SEV-2')
     AND CAST(i.reported_date AS DATE) >= DATE '2025-01-01'
     AND CAST(i.reported_date AS DATE) <  DATE '2026-01-01'
    GROUP BY mr.manager_id
),
latest_salary AS (
    SELECT employee_id, MAX(effective_date) AS effective_date
    FROM salary_records GROUP BY employee_id
),
successor_metrics AS (
    SELECT mr.manager_id,
           MAX(CASE
               WHEN sr.esop_units_granted > 0
                AND sr.performance_rating IN ('Exceeds','Meets Expectations','Meets')
                AND CAST(REPLACE(e.level,'L','') AS INT) >= 4
               THEN 1 ELSE 0 END) AS ready_successor
    FROM manager_reports mr
    JOIN employees e ON e.employee_id = mr.report_id
    JOIN latest_salary ls ON ls.employee_id = e.employee_id
    JOIN salary_records sr ON sr.employee_id = e.employee_id AND sr.effective_date = ls.effective_date
    GROUP BY mr.manager_id
)
SELECT
    e.employee_id AS manager_employee_id,
    e.first_name || ' ' || e.last_name AS manager_name,
    e.level AS manager_level,
    e.job_title,
    tm.total_team_size,
    ROUND(cm.customer_arr_under_team, 2) AS customer_arr_under_team,
    COALESCE(im.serious_incidents_from_team,0) AS serious_incidents_from_team,
    COALESCE(sm.ready_successor,0) AS ready_successor,
    ROUND(tm.total_team_size + cm.customer_arr_under_team/100.0
          + COALESCE(im.serious_incidents_from_team,0)*5, 2) AS spof_score
FROM team_metrics tm
JOIN employees e ON e.employee_id = tm.manager_id
LEFT JOIN customer_metrics cm ON cm.manager_id = tm.manager_id
LEFT JOIN incident_metrics im ON im.manager_id = tm.manager_id
LEFT JOIN successor_metrics sm ON sm.manager_id = tm.manager_id
ORDER BY spof_score DESC
LIMIT 12
"""

df = con.execute(SQL).df()
print("=" * 100)
print("GROUND-TRUTH SPOF RANKING (recomputed independently from technova.duckdb)")
print("=" * 100)
print(df.to_string(index=False))

# Sanity totals
print()
print("=== independent sanity totals ===")
total_managers = con.execute(
    "SELECT COUNT(DISTINCT manager_employee_id) FROM employees WHERE manager_employee_id IS NOT NULL"
).fetchone()[0]
sev12 = con.execute(
    "SELECT COUNT(*) FROM incidents WHERE severity IN ('SEV-1','SEV-2') "
    "AND CAST(reported_date AS DATE) >= DATE '2025-01-01' AND CAST(reported_date AS DATE) < DATE '2026-01-01'"
).fetchone()[0]
total_arr = con.execute(
    "SELECT ROUND(SUM(arr_inr_lakhs),2) FROM customers WHERE account_status='Active'"
).fetchone()[0]
print(f"managers (≥1 direct report)     : {total_managers}")
print(f"SEV-1/2 incidents in CY 2025    : {sev12}")
print(f"total active customer ARR (lakhs): {total_arr}")

# What were the agent's reported numbers?
agent_top10 = [
    (1001, "Rajesh Sharma", 75, 14394.8, 15, 1, 293.95),
    (1002, "Arun Patel", 65, 12494.8, 4, 1, 209.95),
    (1006, "Ananya Gupta", 18, 12494.8, 0, 0, 142.95),
    (1012, "Aarti Iyer", 12, 9026.01, 0, 1, 102.26),
    (1005, "Priya Venkatesh", 26, 0.0, 1, 1, 31.00),
    (1007, "Karthik Iyer", 9, 0.0, 3, 1, 24.00),
    (1021, "Manish Iyer", 6, 0.0, 2, 0, 16.00),
    (1010, "Rohit Bhatt", 10, 0.0, 1, 1, 15.00),
    (1008, "Divya Menon", 13, 0.0, 0, 1, 13.00),
    (1017, "Ishaan Kulkarni", 3, 0.0, 2, 0, 13.00),
]

print()
print("=== row-by-row diff: agent claim vs ground truth ===")
print(f"{'rank':<5}{'name':<22}{'team':<10}{'arr':<14}{'inc':<6}{'succ':<6}{'score':<10}{'verdict'}")
for i, (eid, name, t, arr, inc, succ, score) in enumerate(agent_top10, 1):
    row = df[df["manager_employee_id"] == eid]
    if row.empty:
        print(f"  {i:<3}  {name:<20}  NOT IN GROUND TRUTH TOP-12")
        continue
    g = row.iloc[0]
    parts = []
    parts.append("✓" if g["total_team_size"] == t else f"✗ team {g['total_team_size']} vs {t}")
    parts.append("✓" if abs(float(g["customer_arr_under_team"]) - arr) < 0.01 else f"✗ arr {g['customer_arr_under_team']} vs {arr}")
    parts.append("✓" if g["serious_incidents_from_team"] == inc else f"✗ inc {g['serious_incidents_from_team']} vs {inc}")
    parts.append("✓" if g["ready_successor"] == succ else f"✗ succ {g['ready_successor']} vs {succ}")
    parts.append("✓" if abs(float(g["spof_score"]) - score) < 0.5 else f"✗ score {g['spof_score']} vs {score}")
    verdict = " ".join(parts)
    print(f"  {i:<3} {name:<20} {g['total_team_size']:<8} {float(g['customer_arr_under_team']):<12.2f} {g['serious_incidents_from_team']:<5} {g['ready_successor']:<5} {float(g['spof_score']):<8.2f} {verdict}")
