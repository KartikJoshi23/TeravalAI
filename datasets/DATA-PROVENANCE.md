# Data Provenance — Teraval real-data sourcing

Collaborator: Prem Kukreja · Accessed: **2026-08-02** · USD→AED peg used: **3.6725**

This records the official figures sourced to back the model's assumptions, with
source + date for each, so the master laptop can apply them and cite them in the
Ethics & Audit tab + LaTeX report.

## Key figures found (2 of 3)

| Assumption | Official figure | Source | Date | Evidence file |
|---|---|---|---|---|
| **CBUAE Base Rate** | **3.65%** | Central Bank of the UAE — Press Release "CBUAE Maintains The Base Rate At 3.65%" (News & Publications → Press Releases), [centralbank.ae](https://www.centralbank.ae/) | **29 Jul 2026** (unchanged since Dec 2025 cut) | `interest-rates/cbuae-base-rate-2026.png` |
| **3-month EIBOR** | **3.94%** (3.939870) | CBUAE — EIBOR Rates table, [centralbank.ae/en/forex-eibor/eibor-rates](https://www.centralbank.ae/en/forex-eibor/eibor-rates/) | row **31 Jul 2026** | `interest-rates/cbuae-eibor-2026.pdf` |
| **Abu Dhabi industrial electricity tariff (AED/kWh)** | ⬜ **PENDING** — see below | — | — | — |

### How these feed the model
- Base Rate (3.65%) and 3-month EIBOR (3.94%) are the UAE benchmark rates that
  anchor the **risk-free rate / cost of debt in the WACC build-up**. The plan's
  base case used R_f ≈ 4.3%; the current official rates (~3.65–3.94%) are lower,
  so the master should revisit the WACC inputs and cite these as the anchor.
- The **base WACC (9%) and the tariff (0.15 AED/kWh)** remain the model defaults
  until the master applies any changes; the finance engine + Python reference
  must stay in sync and all tests green if a default is changed.

## Optional comparison saved
- `electricity-tariff/kapsarc-gcc-tariffs.csv` — KAPSARC "GCC Residential
  Electricity Tariffs" ([datasource.kapsarc.org/.../gcc-electricity](https://datasource.kapsarc.org/explore/dataset/gcc-electricity/)).
  **Residential only** — it has no Abu Dhabi *industrial* rate. For context, the
  "Other UAE" residential rates are: Nationals ~US$0.02/kWh (≈ AED 0.07), Expats
  ~US$0.076–0.12/kWh (≈ AED 0.28–0.44). Not a substitute for the industrial figure.

## Pending / blocked (portal outage)

- **⭐ Abu Dhabi industrial tariff (the key figure):** not obtained.
  - ADDC/TAQA ([taqadistribution.com](https://taqadistribution.com)) exposes **no
    public non-residential tariff table** (only an EV-charging tariff).
  - The right source — Abu Dhabi Open Data dataset **"Electricity Tariff by
    Authority, slab Rate and sector (ADWEA)"** on [data.abudhabi](https://data.abudhabi/opendata/dataset?q=electricity%20tariff)
    — serves its data via **`data.bayanat.ae`, which was unreachable**
    (`ERR_CONNECTION_TIMED_OUT`) on 2026-08-02. So the CSV would not download and
    "Data Preview"/"Export" were dead.
  - **Retry** when the portal is back, or use **DoE Abu Dhabi** as an alternative
    authoritative source. Read the **non-residential slab in fils/kWh** → ÷100 =
    AED/kWh (model currently assumes 0.15 AED/kWh = 15 fils/kWh).
- **`energy-context/` (optional, report realism):** empty — Bayanat energy
  datasets and the FCSC "Electricity Consumption by Area and Sector" are on the
  same down portal. Non-blocking.
