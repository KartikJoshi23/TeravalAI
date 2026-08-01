# datasets/ — real official data backing Teraval's assumptions

This folder holds **real, publicly-published datasets** that back three of the model's
assumptions with official figures (instead of researched benchmarks). A collaborator
downloads them from the portals below and saves each file into the matching subfolder.
The master laptop then updates the model to the official numbers and adds a
"Data Provenance" section to the dashboard + report.

> Most portals let you download without an account; a few ask for a **free sign-in**
> before the download button works. Sign in if prompted — these are public datasets.
> Prefer **CSV** where offered; otherwise XLSX; otherwise save the official page as **PDF**.

---

## 1. `electricity-tariff/`  → backs the **electricity tariff** assumption (now AED 0.15/kWh)

**What we need:** the current **industrial / commercial electricity tariff (AED per kWh)** for
Abu Dhabi.

- **Primary — official rate:** open the **ADDC tariff page** at
  https://www.addc.ae/ (Home → Billing/Tariff, or search "tariff"). Find the
  **non-residential / industrial** rate table and **save the page as PDF**.
  → save as `electricity-tariff/addc-industrial-tariff-2026.pdf`
- **Secondary — dataset:** on the **Abu Dhabi Open Data Platform** (https://data.abudhabi/)
  use the search box for **"electricity tariff"** (and "ADDC tariff"). If a tariff dataset
  exists, download the **CSV**.
  → save as `electricity-tariff/addc-tariff-dataset.csv`
- **Optional context — GCC comparison:** KAPSARC "GCC Residential Electricity Tariffs"
  https://datasource.kapsarc.org/explore/dataset/gcc-electricity/ → **Export → CSV**.
  → save as `electricity-tariff/kapsarc-gcc-tariffs.csv`

**The one figure that matters:** the Abu Dhabi **industrial AED/kWh** rate (to confirm or
replace 0.15). Note it in your progress.md update.

---

## 2. `interest-rates/`  → backs the **WACC** (risk-free rate / cost of debt, now ~9% WACC)

**What we need:** the current UAE benchmark interest rate.

- **Central Bank of the UAE — EIBOR:** open https://www.centralbank.ae/en/forex-eibor/eibor-rates/
  and download the **EIBOR rates table** (look for a download / export link; else save the
  page as PDF). We want the **3-month EIBOR** tenor.
  → save as `interest-rates/cbuae-eibor-2026.csv` (or `.pdf`)
- **Central Bank Base Rate:** from https://www.centralbank.ae/ (Monetary Policy → Base Rate),
  save the current **Base Rate** figure (page as PDF is fine).
  → save as `interest-rates/cbuae-base-rate-2026.pdf`

**The two figures that matter:** the **base rate** and the **3-month EIBOR** (used as the
risk-free / cost-of-debt anchor in the WACC build-up). Note both in your progress.md update.

---

## 3. `energy-context/`  → real UAE electricity context (for report realism, not the core math)

**What we need:** UAE electricity **generation & demand** figures for the report's context.

- **UAE Open Data Portal (Bayanat) — Energy group:** http://data.bayanat.ae/en_GB/group/energy
  Download these datasets (CSV where available):
  - **"Total amount of electricity consumption"**
  - **"Total electricity generated for all power plants"** (peak demand / generation)
  → save into `energy-context/` keeping the portal's file names.
- **Federal Competitiveness & Statistics Centre (FCSC):**
  https://opendata.fcsc.gov.ae/ → search **"Electricity Consumption According to the Area and
  Sector"** → download CSV.
  → save as `energy-context/fcsc-electricity-by-sector.csv`

---

## After downloading

1. Put each file in the right subfolder with the suggested name.
2. In your **progress.md** update, list **exactly which files you saved** and the **key figures**
   you found (industrial tariff AED/kWh; base rate %; 3-month EIBOR %).
3. Commit the files + progress.md and push. The master laptop takes it from there
   (updates the model to official numbers + adds the Data Provenance section).
