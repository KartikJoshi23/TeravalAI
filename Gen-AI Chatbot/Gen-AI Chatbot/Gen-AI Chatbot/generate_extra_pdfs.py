"""
Generate 5 additional PDFs filling gaps in the corpus:
  TechNova_DRHP_Draft.pdf
  TechNova_DR_BCP_Plan.pdf
  TechNova_AI_Governance_Framework.pdf
  TechNova_Sales_Comp_Plan_FY25_26.pdf
  TechNova_ISMS_Policy.pdf

Each PDF follows the existing format used by the chunker:
  - Title block (company / doc title / dept / version / classification)
  - Numbered sections "1. Title", "2. Title", etc. — chunker splits on this regex
  - 4-6 pages each, dense enterprise prose with specific numbers/dates/entities
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (PageBreak, Paragraph, SimpleDocTemplate, Spacer)

OUT_DIR = Path("Unstructured data")
OUT_DIR.mkdir(exist_ok=True)


def build_pdf(filename: str, header: dict, sections: list[tuple[int, str, str]]) -> None:
    path = OUT_DIR / filename
    doc = SimpleDocTemplate(
        str(path), pagesize=letter,
        leftMargin=0.9 * inch, rightMargin=0.9 * inch,
        topMargin=0.85 * inch, bottomMargin=0.85 * inch,
    )
    styles = getSampleStyleSheet()
    h_title = ParagraphStyle("hTitle", parent=styles["Title"], fontSize=18, leading=22, spaceAfter=4)
    h_sub = ParagraphStyle("hSub", parent=styles["Normal"], fontSize=10, textColor="grey", spaceAfter=2, italic=True)
    h_class = ParagraphStyle("hClass", parent=styles["Normal"], fontSize=9, textColor="red", spaceAfter=14, fontName="Helvetica-Bold")
    section_h = ParagraphStyle("sectionH", parent=styles["Heading2"], fontSize=13, leading=16, spaceBefore=18, spaceAfter=8, textColor="#1f2937")
    body = ParagraphStyle("body", parent=styles["BodyText"], fontSize=10.5, leading=15, spaceAfter=8)
    flow = []
    flow.append(Paragraph("TechNova Inc.", h_sub))
    flow.append(Paragraph(header["title"], h_title))
    flow.append(Paragraph(header["meta"], h_sub))
    flow.append(Paragraph(header["classification"], h_class))
    flow.append(Spacer(1, 0.05 * inch))
    for num, title, body_txt in sections:
        flow.append(Paragraph(f"{num}. {title}", section_h))
        # Body may be multi-paragraph: split on blank lines
        for para in body_txt.strip().split("\n\n"):
            flow.append(Paragraph(para.strip().replace("\n", " "), body))
    flow.append(Spacer(1, 0.3 * inch))
    flow.append(Paragraph("<i>Copyright 2025-2026 TechNova Inc. All rights reserved.</i>",
                          ParagraphStyle("foot", parent=styles["Normal"], fontSize=8, textColor="grey")))
    doc.build(flow)
    print(f"  wrote {path}")


# ---------- 1. DRHP Draft ----------
DRHP_SECTIONS = [
    (1, "Company Overview and Offering Summary", """
TechNova Inc. is filing this Draft Red Herring Prospectus (DRHP) with the Securities and Exchange Board of India (SEBI) targeting a September 2026 filing window, with a proposed listing on BSE and NSE in Q3 FY2027-28. The proposed issue size is INR 2,000-2,500 crores comprising a fresh issue and an Offer for Sale (OFS) by existing shareholders. Pre-IPO valuation as estimated by the appointed Book Running Lead Managers, Kotak Mahindra Capital and Goldman Sachs (India) Securities, ranges from INR 8,500 crores to INR 10,000 crores, representing approximately 10-12 times trailing Annual Recurring Revenue.

TechNova operates the Nova Platform, a SaaS analytics and AI orchestration product serving 2,847 enterprise customers across 43 countries as of March 2026. The platform processes an average of 4.2 million API requests per hour with a contractual uptime SLA of 99.97%. Revenue for FY2025-26 was INR 847.3 crores (Q4 alone), an EBITDA margin of 23.0%, and free cash flow of INR 156.8 crores. The company has INR 892.4 crores of cash on its balance sheet and zero long-term debt.

The legal counsel for the offering is AZB & Partners (domestic) and Davis Polk & Wardwell LLP (international). The statutory auditor is Deloitte Haskins & Sells LLP. The Audit Committee Chair is Dr. Vikram Reddy, Independent Director.
"""),
    (2, "Business Strategy and Growth Plan", """
TechNova's IPO readiness depends on three measurable milestones, each of which is tracked monthly by the Board IPO Committee constituted in January 2026.

The first milestone is enterprise customer count. The company targets 3,500 paying enterprise customers by the end of Q2 FY2027, against a current count of 2,847 — leaving a gap of 653 net new logos. The Customer Growth strategy concentrates on Tier-1 accounts in regulated APAC markets (India, Japan, South Korea), Europe, and North America, with FY2026-27 quota allocation of approximately 60% to net-new-logo plays and 40% to expansion within existing accounts.

The second milestone is Net Revenue Retention (NRR). SEBI counsel and BRLM diligence require NRR of at least 120% sustained for four consecutive quarters before DRHP. As of Q4 FY2025-26, NRR is 118.3%, which is below threshold; the four-quarter consecutive clock therefore has not yet started. Management's plan to close the gap relies on three vectors: (i) accelerating adoption of AI/ML features which carry premium pricing, (ii) expansion seats from existing Tier-1 customers in regulated industries, and (iii) reducing churn through the Customer Success transformation initiated in February 2026.

The third milestone is the security certification programme: SOC 2 Type II and ISO 27001 covering ALL product modules by December 2026. As of the date of this DRHP draft, SOC 2 Type II covers 70% of in-scope modules and ISO 27001 covers 55%. The remediation plan is detailed in the ISMS policy and is owned by the CISO, with approved capital expenditure of INR 8.5 crores following the November 2025 cybersecurity incident (INC-2025-0847).
"""),
    (3, "Management Discussion and Analysis", """
For FY2025-26, the company recorded Q4 revenue of INR 847.3 crores, exceeding the Board-approved budget of INR 813 crores by 4.2%. Subscription revenue contributed 78%, professional services 14%, and licensing/other 8%. Geographic revenue split: APAC 41%, North America 33%, Europe 19%, MEA 7%.

EBITDA margin of 23.0% materially exceeded the target of 21.5%, driven by continued operating leverage on the cloud cost line and salary discipline (variable pay was funded at 1.15x of target reflecting 108% achievement of company performance against revenue plan). Management notes that the Engineering department utilised 94.7% of its INR 210 crore Q4 budget; the primary overspend driver was cloud infrastructure (+INR 12.3 crores over budget), partially offset by underspend in contractor hiring.

The principal one-time items affecting comparability are: (i) the Audit Committee observation on the capitalisation treatment of INR 14.2 crores in AI model development costs (currently being discussed with Deloitte; if expensed, it would reduce reported PAT by approximately INR 10.3 crores after tax); (ii) the Board-approved INR 8.5 crore additional cybersecurity spend following INC-2025-0847; and (iii) approval of INR 120 crore CapEx for the Singapore data centre expansion to support APAC localisation requirements.

Free cash flow conversion was 88% of EBITDA. Cash on balance sheet at quarter-end was INR 892.4 crores with zero long-term debt. The company maintains a INR 200 crore committed unfunded credit facility from HDFC Bank for working-capital flexibility. Days Sales Outstanding (DSO) declined from 67 days at the start of FY2025-26 to 58 days at the end, reflecting improved collections discipline and a shift toward annual upfront billing.
"""),
    (4, "Risk Factors", """
Management identifies the following risk categories as material to investors. This is not an exhaustive list and additional risks may emerge.

Customer concentration. The top 10 customers contributed approximately 38% of FY2025-26 revenue. The largest single customer represented 6.2% of revenue. Loss of any of the top 10 customers could materially adversely affect financial performance.

Cybersecurity and data integrity. The November 2025 incident INC-2025-0847 affected 847 customer accounts and required CERT-In notification within 6 hours. The company has since accelerated Zero Trust deployment from March 2026 to February 2026 and approved INR 8.5 crore additional spend, but a repeat incident — particularly on a critical AI service — could damage customer trust, breach SLAs, and slip the SOC 2 / ISO 27001 timeline. The cyber insurance policy with ICICI Lombard provides INR 50 crore coverage at an annual premium of INR 28 lakhs.

Geopolitical and regulatory. Vietnam and Indonesia have introduced data-localisation requirements that may compel in-country deployment. The platform currently operates from AWS primary and GCP disaster recovery, with database read-replicas in US-East, EU-West, and AP-South — but not yet in-country in Vietnam or Indonesia. The legal team is preparing a compliance roadmap. Failure to meet localisation may force customer offboarding in those markets.

Concentration of AI infrastructure. The AI/ML production stack runs on a single dedicated EKS cluster with 16 NVIDIA A100 GPU nodes (128 GPUs total). There is no regional redundancy for AI workloads. A single incident on this cluster could affect all AI features simultaneously.

Talent retention and key-person risk. ESOPs are granted only at L5 and above (FMV INR 842 per share). Retention bonuses are policy-capped at 30% of CTC for critical talent (40% for counter-offers). The Chief Revenue Officer position is identified by HR as a single-point-of-failure with no vested ready successor below L5.
"""),
    (5, "Capital Structure and ESOP Schedule", """
The current share capital comprises 100% equity shares with no preference shares outstanding. The fully diluted share count includes the existing ESOP pool of 8.2% of fully diluted equity, plus the additional 2% pool approved by the Board on January 22, 2026 for pre-IPO senior talent retention. The 409A valuation conducted by an independent third party in December 2025 set the FMV at INR 842 per share.

ESOP grants vest over a four-year schedule with a one-year cliff: 25% of granted units vest at the end of Year 1, with the remaining 75% vesting monthly over the subsequent 36 months. ESOPs are granted only to employees at Level 5 (Senior Manager / Architect) and above. The policy specifies that the IPO listing event will create the first liquidity event for ESOP holders; pre-IPO buybacks have not been contemplated by the Board.

CEO compensation for FY2025-26: Base INR 72 lakhs + Variable INR 48 lakhs + ESOPs valued at INR 2.4 crores (vesting over 4 years) + Benefits INR 8.5 lakhs = approximately INR 1.52 crores total CTC excluding ESOP valuation gains. CTO compensation: Base INR 65 lakhs + Variable INR 39 lakhs + ESOPs INR 1.8 crores + Benefits INR 8.5 lakhs = approximately INR 1.20 crores. The CEO-to-median-employee pay ratio is 18.4:1, below the Indian IT industry average of 24:1. The Compensation Committee reviews executive pay annually against a peer group of 12 companies.
"""),
    (6, "Use of Proceeds", """
Net proceeds from the fresh issue of approximately INR 1,400-1,750 crores (after deducting offer expenses) are intended to be deployed across four strategic categories.

First, AI/ML capacity expansion (approximately 40-45% of net proceeds). This includes a planned acquisition of an additional 32 NVIDIA H100 GPU nodes for the production AI cluster, multi-region failover architecture for AI inference (Tokyo and Frankfurt regions), and the self-hosted RAG stack on 4x A100 nodes with customer-specific Qdrant indices as outlined in the FY26-27 product roadmap.

Second, geographic expansion and data-residency compliance (approximately 25-30%). The Singapore data centre expansion (INR 120 crore CapEx already approved) is the lead initiative. Additional in-region deployments in Vietnam and Indonesia are planned to address localisation requirements.

Third, sales and marketing spend (approximately 15-20%) to close the 653-customer gap to the IPO milestone of 3,500 paying enterprise customers, including expansion of the inbound demand-generation engine and partner-channel investments in Southeast Asia and Latin America.

Fourth, general corporate purposes and strategic acquisitions (approximately 10-15%), including potential bolt-on acquisitions in adjacent verticals such as data-labelling, MLOps tooling, and vertical industry connectors. No specific acquisition target is identified or under negotiation as of the date of this DRHP draft.
"""),
    (7, "Material Litigation and Contingent Liabilities", """
As of March 31, 2026 the company has the following material disclosures.

Tax matters. The company is in dispute with the Income Tax Department on transfer pricing for FY2021-22 and FY2022-23, with disputed tax demand of INR 14.6 crores plus interest. Management, supported by Khaitan & Co counsel, believes the position is well-supported by independent transfer-pricing documentation and the demand will be vacated on appeal. No provision is recorded; this is disclosed as a contingent liability.

Employment matters. One former L7 employee filed a wrongful-termination suit in the Bangalore Employment Tribunal in October 2024, claiming arrears of INR 0.85 crores. The matter is in arbitration and is not material individually.

Contractual matters. The Suspended-status vendor VendorConnect Solutions has indicated it may dispute the security-related termination clause invoked after INC-2025-0847; the contract value at risk is approximately USD 180,000 annually. Khaitan & Co considers the company's position defensible.

There are no other material litigation, regulatory enforcement actions, or governmental investigations pending against the company or its directors as of the date of this DRHP draft.
"""),
]

# ---------- 2. DR/BCP ----------
DR_SECTIONS = [
    (1, "Scope, Authority, and Activation Triggers", """
This Disaster Recovery and Business Continuity Plan covers the Nova Platform production environment, the customer-facing API surface, the AI/ML inference layer, and all primary data stores. It does not cover individual employee workstations or non-production environments.

Authority to declare a disaster rests jointly with the Chief Technology Officer (Vikram Reddy) and the Chief Information Security Officer (Karthik Iyer); a single declaration by either is sufficient. In their absence, the SVP of Engineering or the Head of Site Reliability Engineering may declare. All declarations must be communicated to the Board IPO Committee within 24 hours.

Activation triggers include: (i) a SEV-1 incident exceeding two hours of unmitigated impact; (ii) primary AWS region (ap-south-1) unavailability exceeding 30 minutes; (iii) confirmed compromise of customer-managed encryption keys (BYOK); (iv) regulatory order to suspend service in any jurisdiction; or (v) physical damage at the Bangalore office that prevents Engineering and SRE teams from operating.
"""),
    (2, "Recovery Time and Recovery Point Objectives", """
The platform is segmented into three service tiers with distinct recovery targets, aligned to the criticality_tier values in the products_services table.

Tier 1 (Critical) services: RTO of 30 minutes, RPO of 5 minutes. This applies to user-management, authentication, the API gateway, and the core analytics engine. These are the services whose total outage constitutes a SEV-1 event.

Tier 2 (High) services: RTO of 2 hours, RPO of 30 minutes. Includes the data-processing batch pipelines, the AI/ML inference layer, and the integration hub.

Tier 3 (Medium and Low) services: RTO of 8 hours, RPO of 4 hours. Includes administrative tooling, internal dashboards, and the reporting subsystem.

These RTO/RPO commitments are stricter than the contractual SLA in customer MSAs by design; the customer SLA of 99.97% uptime translates to a permissible outage budget of 2.6 hours per quarter, which the internal targets aim to keep well below.

The contractual SLA cap on aggregate service credits in any twelve-month period is 20% of the affected customer's annual fees. Service credit floor varies by contract: standard is 5%, premium-tier customers negotiate up to 20%.
"""),
    (3, "Disaster Recovery Architecture", """
The platform runs on AWS as primary (ap-south-1 region in Mumbai) with Google Cloud Platform (asia-southeast1 in Singapore) for disaster recovery. Replication is asynchronous for transactional databases (PostgreSQL 16 on AWS RDS Multi-AZ) with a target replication lag of less than 30 seconds during normal operation.

Read replicas are deployed in three additional AWS regions: us-east-1, eu-west-1, and ap-south-1. Time-series telemetry and audit logs are stored in TimescaleDB with a 90-day hot retention window and S3-backed cold storage for 7-year compliance retention. Search indices for customer-facing analytics are maintained on Elasticsearch (18 nodes, 142 TB), with cross-region replication to the GCP DR site.

The AI/ML production stack runs on a dedicated single EKS cluster with 16 NVIDIA A100 GPU nodes (8 GPUs per node = 128 GPUs total). Critical limitation: there is no regional redundancy for AI workloads, meaning AI inference cannot failover to GCP. The FY26-27 product roadmap allocates capital for a Tokyo and Frankfurt AI failover architecture; until that completes, AI is a single point of failure.
"""),
    (4, "Failover Procedures by Service Tier", """
For Tier 1 service failover, the runbook prescribes the following sequence. Step 1: SRE primary on-call validates the trigger (RTO clock starts at trigger confirmation). Step 2: Initiate AWS to GCP failover via the pre-staged Terraform pipeline; this is a 18-minute median operation per quarterly drill records. Step 3: Update the global DNS (Route 53 weighted records) to redirect customer traffic to the GCP endpoint. Step 4: Validate authentication, API gateway, and analytics-engine health from synthetic monitoring within 5 minutes of DNS propagation. Step 5: Notify customers via the status-page and email. Step 6: Post-incident review within 5 business days.

For Tier 2 service failover, additional steps include rebuilding the data-processing batch pipelines from the last completed checkpoint (RPO of 30 minutes means up to 30 minutes of pending work may need to be re-run). For the AI/ML inference layer specifically, since regional failover is not yet available, the documented procedure is to fail OPEN in degraded mode — serving cached predictions from a 24-hour Redis tier — for up to 4 hours while the EKS cluster is restored.

For Tier 3 services, manual failover is acceptable and SRE on-call may defer to business-hours.
"""),
    (5, "DR Drill History and Findings", """
DR drills are conducted quarterly. The last four drills are summarised below:

Q1 FY2025-26 drill (June 2025): Tier 1 failover. Achieved RTO of 28 minutes (target: 30 minutes). PASS. Two findings: (i) DNS propagation delay observed in ap-southeast-2 region (5 minutes); (ii) authentication token validation latency increased by 40% post-failover until cache warmed. Both remediated by Q2.

Q2 FY2025-26 drill (September 2025): Full-stack DR including Tier 2. RTO 2 hours 18 minutes (target: 2 hours). FAIL. Findings: (i) data-processing pipeline restart required manual intervention not in the runbook; (ii) one customer-managed encryption key rotation was not handled cleanly. Both remediated by Q3.

Q3 FY2025-26 drill (December 2025): Tabletop-only following INC-2025-0847; full failover deferred to Q4. Findings focused on incident-response coordination with security team.

Q4 FY2025-26 drill (March 2026): Tier 1 failover. RTO 22 minutes. PASS with no findings. The next full drill is scheduled for June 2026.
"""),
    (6, "Crisis Communication and Escalation", """
During an active disaster, communication is governed by a strict matrix to avoid contradictory messaging.

Internal communication: a Slack incident channel is auto-created by the on-call paging tool; the SRE on-call commander chairs it. The incident channel must include representatives from Engineering, SRE, Customer Success, Legal, and Communications. The Board IPO Committee is notified within 24 hours of any declaration.

External customer communication: the status page is the canonical source; updates are posted within 15 minutes of declaration and every 30 minutes thereafter until resolution. For Tier-1 customers and Tier-2 customers in regulated industries (BFSI, Healthcare), Customer Success initiates direct outreach within 1 hour. The CEO and CRO must approve any customer communication that names a specific cause until the post-incident review confirms the root cause.

Regulatory communication: for any breach involving customer personal data, CERT-In must be notified within 6 hours. For DPDP Act personal data breaches, the Data Protection Board must be notified. Legal counsel (Khaitan & Co) is engaged automatically for any regulatory communication.

Media communication: only the CEO and the Head of Communications are authorised to engage media. All media enquiries during an active disaster are directed to communications@technova.com with a default no-comment policy until cleared.
"""),
]

# ---------- 3. AI Governance ----------
AI_SECTIONS = [
    (1, "AI Governance Structure and Authority", """
The AI Governance Framework was approved by the Board on January 22, 2026 and applies to all production AI/ML models deployed by TechNova on the Nova Platform, whether developed in-house or sourced from third parties. It does not apply to research prototypes that are clearly labelled non-production.

Governance is exercised by the AI Ethics Committee (AIEC), constituted of five voting members: the Chief Technology Officer (chair), the Chief Information Security Officer, the Chief Revenue Officer (representing customer impact), one independent director (currently Dr. Vikram Reddy), and the General Counsel. The AIEC meets monthly; meeting minutes are board-visible. Quorum requires three voting members including the chair or the General Counsel.

The AIEC has exclusive authority to: (i) approve any new AI model's promotion to production, (ii) approve material changes (defined below) to a production model, (iii) suspend any production model in response to a fairness, safety, or compliance concern, and (iv) approve customer-facing communication that describes a model's behaviour.
"""),
    (2, "Model Lifecycle and Material Change Definition", """
Every production AI model passes through five gates: (G1) Concept Approval, (G2) Training Data Approval, (G3) Bias and Fairness Testing, (G4) Pre-Production Risk Review, (G5) Post-Deployment Monitoring Plan. Gates G1 through G4 require AIEC sign-off; G5 is operational and managed by the SRE-AI team.

A material change requiring re-approval is any of the following: (i) any change to the training dataset that adds or removes more than 5% of records; (ii) any change to the loss function or model architecture; (iii) any change to a feature input that materially affects a protected attribute; (iv) any deployment to a new geographic market where the model has not been previously validated; (v) any change in inference latency exceeding 25% of the prior baseline.

Non-material changes (e.g. infrastructure updates, batch-size tuning that does not affect outputs) may be approved by the SRE-AI team alone without an AIEC vote, with the change captured in the model card.
"""),
    (3, "Bias, Fairness, and Safety Testing", """
Every production model is tested for disparate impact across the following protected attributes: gender, age band, region (with India-specific tests for regional bias), industry (with specific BFSI and Healthcare bias panels because of regulatory sensitivity), and customer-tier. The current bias-testing suite uses Aequitas, Fairlearn, and an in-house regulatory checklist.

Acceptance thresholds: (i) maximum disparity of 10 percentage points between the highest-performing and lowest-performing protected group on the model's primary metric (typically AUC or F1); (ii) for credit and risk-scoring use cases (which TechNova does not currently sell but may in future), the threshold tightens to 4 percentage points; (iii) any disparity exceeding 5 percentage points triggers an automatic AIEC review.

Safety testing for generative AI features specifically includes: prompt injection resistance, data exfiltration via prompts (no customer data should leave the model context), refusal-rate calibration, and citation-faithfulness for the AI Co-pilot feature. Generative outputs that cite sources must achieve 95% faithfulness in QA samples; AI Co-pilot is currently at 96.2%.
"""),
    (4, "Model Risk Tiers and Approval Authority", """
TechNova classifies AI models into three risk tiers, each with distinct approval requirements.

Tier A (High Risk) models include any model whose output directly drives an automated decision affecting customer money, customer access, or regulated outcomes. These require unanimous AIEC approval at G1, G2, G3, and G4 gates. Tier A models also require an external audit by a recognised AI assurance firm before launch; no Tier A models are currently in production at TechNova.

Tier B (Medium Risk) models include recommendation systems that materially influence customer decisions but where a human reviews the output, and forecasting models used in operational planning. The AI Co-pilot, Predictive Forecasting (ML), and AI-Powered Anomaly Detection features fall in this tier. They require AIEC majority approval (3 of 5 votes) at all gates and quarterly post-deployment monitoring reviews.

Tier C (Low Risk) models include narrow utility models such as ranking, sorting, and search-relevance scoring where output is non-binding and easily verifiable by the user. Tier C models can be approved by the CTO and CISO jointly without full AIEC voting.

The current Tier B inventory: TechNova-Classify (BERT for document classification), TechNova-Extract (custom NER for data extraction), TechNova-Assist (RAG-based customer support powered by Qwen-2.5-72B with LoRA adapters), Predictive Forecasting (ML), AI-Powered Anomaly Detection, and AI Co-pilot (Beta).
"""),
    (5, "Production Monitoring, Drift, and Deprecation", """
Every production model has a continuously-monitored model card containing: model version, training-data summary, bias-test results, performance benchmarks, deployment regions, last AIEC review date, and known limitations. Model cards are accessible to Customer Success teams and on request to enterprise customers under NDA.

Drift monitoring uses Evidently AI with thresholds tuned per model. Data drift exceeding 10% on the primary feature distribution triggers a yellow alert; exceeding 20% triggers a red alert and a 5-day window for remediation. Concept drift (degradation of primary metric) follows the same thresholds.

A model deprecation is initiated when (i) the primary metric degrades by more than 15% from launch baseline and cannot be remediated within 30 days, (ii) a successor model with superior fairness or accuracy is launched, or (iii) AIEC determines the use case is no longer aligned with TechNova's policies. Deprecation provides 90-day notice to affected customers and 180-day total runway before final retirement.

The current FY2026-27 plan allocates 38% of the INR 485 crore total product investment budget to AI/ML capabilities (= INR 184.30 crores), with infrastructure including the planned self-hosted RAG stack on 4x A100 nodes with customer-specific Qdrant vector indices.
"""),
    (6, "Customer-Facing AI Disclosure Requirements", """
TechNova's contractual commitments to customers regarding AI feature behaviour are governed by this section.

Disclosure: every customer using a Tier-A or Tier-B AI feature receives a model card excerpt at activation, summarising what the model does, what data it uses, what its known limitations are, and what disparate-impact testing has been done. The customer's MSA Data Processing Addendum (DPA) governs how that customer's data may be used in model training; by default, customer data is NOT used to train shared models without explicit opt-in.

Customer rights: customers may request that AI predictions affecting them be reviewed by a human within 5 business days. Customers may request the deactivation of any AI feature on their tenant within 24 hours. Customers may request a copy of bias-testing results under NDA.

Audit support: TechNova will support customer auditors examining AI model usage on their data with up to 8 hours of engineer time per quarter, included in the standard MSA. Additional audit support is billable.

Regulatory disclosures: in jurisdictions with AI-specific regulations (currently the EU AI Act and emerging India AI Act draft), TechNova maintains a regulatory-mapping document, last refreshed in March 2026, that maps each Tier-A/B model to applicable regulatory categories.
"""),
]

# ---------- 4. Sales Comp Plan ----------
SALES_SECTIONS = [
    (1, "Plan Overview, Effective Period, and Eligibility", """
This Sales Compensation Plan ("Plan") is effective for the fiscal year commencing April 1, 2025 and ending March 31, 2026 ("FY2025-26"), with a transition window through April 30, 2026 to close any open deals against this Plan. A new Plan governs FY2026-27 and is issued separately.

Eligibility extends to all employees in quota-carrying roles in the Sales and Customer Success organisations, specifically: Account Executives (Levels L4-L6), Solution Consultants (Levels L4-L5), Customer Success Managers with renewal-and-expansion quotas (Levels L4-L5), Sales Development Representatives (Level L3), and front-line Sales Managers (Levels L5-L6). Senior leadership (Level L7+) participates in a separate executive incentive plan governed by the Compensation Committee.

Total target compensation ("On-Target Earnings" or OTE) is structured as base salary plus variable pay. The Plan does not modify the base salary component, which is governed by the company-wide Salary Structure (FY2025-26, Version 3.1).
"""),
    (2, "Role-Specific Quotas and OTE Mix", """
Account Executive quotas and OTE mix:
L4 Account Executive: Annual quota INR 18 crores (approximately USD 2.16M at INR 83.5/USD reference), OTE mix 60/40 (60% base, 40% variable). Median OTE: INR 32 lakhs (Base INR 19.2 lakhs + Variable INR 12.8 lakhs at 100% achievement).
L5 Senior Account Executive: Annual quota INR 35 crores, OTE mix 55/45, Median OTE: INR 50 lakhs.
L6 Strategic Account Executive (named accounts): Annual quota INR 75 crores, OTE mix 50/50, Median OTE: INR 78 lakhs.

Solution Consultant OTE mix is 75/25, with quota retired against deals they support (no carrying their own pipeline).

Customer Success Manager quota: 100% of expansion + renewal under their book of business, with separate expansion (40%) and renewal (60%) sub-quotas. Renewal achievement below 90% triggers PIP.

Sales Development Representative compensation: 70/30 base/variable, with variable tied to qualified-meetings count and to ARR generated by the AEs they support.

Quotas are set quarterly with 25% in each fiscal quarter. The Q1 number is set 5% lower than other quarters to reflect ramp-up and pipeline-build patterns; the Q4 number is set 5% higher to reflect typical pull-forward pressure before fiscal year-end.
"""),
    (3, "Commission Structure, Accelerators, and Caps", """
The base commission rate (paid against quota up to 100% achievement) is calculated on Annual Contract Value of closed-won deals at the AE's named rate. New-logo deals are weighted at 1.0x; expansion deals are weighted at 0.8x; renewal deals are weighted at 0.5x. Multi-year deals receive year-1 ACV plus 50% of year-2 ACV plus 25% of year-3 ACV in the year of close.

Above 100% achievement, accelerators apply on incremental ACV: 100-110% achievement pays at 1.5x base rate; 110-130% at 2.0x; 130-150% at 2.5x; above 150% at 3.0x. There is no individual cap on commissions; this is by design to motivate over-performance into the IPO milestone of 3,500 customers by Q2 FY2027.

The Plan caps total Plan-wide variable spend at 1.20x of company-level revenue achievement. If the company achieves 108% of revenue plan, the variable-pay multiplier of 1.15x applies (consistent with the company's broader compensation policy as stated in the Salary Structure document). At higher company achievement, individual accelerators continue but the company-funded portion is capped at 1.20x of plan.
"""),
    (4, "SPIFFs, Strategic Programs, and Special Initiatives", """
SPIFFs (Sales Performance Incentive Funds) are time-limited, opportunity-specific bonuses on top of standard commission. Active SPIFFs for FY2025-26:

NRR Acceleration SPIFF (Q1 - Q4 FY2025-26): INR 50,000 cash bonus per net-new logo closed in regulated industries (BFSI, Healthcare, Government) where the deal includes a 3-year multi-year commitment. Cap: 4 deals per AE per quarter. Designed to accelerate the path to 120% NRR for four consecutive quarters, the IPO milestone.

AI Co-pilot Adoption SPIFF (Q3 - Q4 FY2025-26): INR 25,000 cash bonus per existing customer who adds the AI Co-pilot feature. Stackable with renewal commission. Cap: 8 customers per CSM per quarter.

Localisation Markets SPIFF (Q4 FY2025-26 - Q2 FY2026-27): INR 1,00,000 cash bonus per Tier-1 logo closed in Vietnam or Indonesia (the data-localisation-risk markets identified by the Board), with a stacked 1.25x accelerator on top of the standard new-logo rate. Designed to ensure organic in-region revenue justifies the planned in-country deployment investment.

President's Club: top 5% of AEs by quota achievement qualify for a five-day all-expenses-paid trip (the Q1 FY2026-27 trip is scheduled for Bali in June 2026). This is a recognition programme, not a contractual commitment.
"""),
    (5, "Ramp Schedule for New Hires", """
New AE hires follow a graduated ramp during which a "ramp quota" applies in lieu of full quota. The ramp percentages are:
Month 1 (training month): 0% of full quota; AE earns full base pay only with no variable expectation.
Month 2: 25% of monthly full-quota run-rate.
Month 3: 50%.
Months 4-6 (Q2 of tenure): 75%.
Months 7+ (Q3 of tenure onward): 100% of full quota.

During the first three months, the AE is paid a Ramp Guarantee equal to 50% of the variable target (i.e. half of what they'd make at 100% quota achievement at full rate), prorated monthly. This ensures earnings predictability during onboarding.

The ramp is shorter (4 months to full quota) for AEs hired with verifiable prior SaaS quota-attainment of 100%+ at a peer company. It is longer (9 months to full quota) for AEs hired into new geographic regions where TechNova has not previously sold (e.g. the planned Vietnam expansion).

Solution Consultant ramps follow a similar 6-month structure but with milestones tied to certifications and shadowed deals rather than ACV.
"""),
    (6, "Deal Desk Approvals and Discount Authority", """
Discount authority is graduated by deal size and discount level, governed by the Deal Desk function which sits in the Office of the CRO.

For deals up to INR 30 lakhs ACV with a discount of less than 10%: approval rests with the AE alone.
For deals up to INR 30 lakhs with discount 10-25%: requires Sales Manager approval (L5+).
For deals up to INR 30 lakhs with discount above 25%: requires CRO approval.

For deals INR 30 lakhs - INR 1 crore: discount up to 10% requires Sales Manager approval; 10-20% requires Sales Director (L6+) approval; above 20% requires CRO approval.

For deals above INR 1 crore: any discount requires CRO approval. Above INR 5 crore in ACV with discount over 15% additionally requires CFO approval.

Non-standard contractual terms — particularly liability cap below the default INR 2x annual fees, indemnity carve-outs, and bespoke SLAs — require Legal sign-off in addition to commercial approval. Deal Desk maintains a non-standard-terms registry.

Multi-year deals with year-1 lower than year-2 (deferred-revenue-shaped deals) require CFO approval given the impact on revenue recognition timing.
"""),
]

# ---------- 5. ISMS Policy ----------
ISMS_SECTIONS = [
    (1, "ISMS Scope, Context, and Statement of Applicability", """
The TechNova Information Security Management System (ISMS) is implemented in alignment with ISO/IEC 27001:2022 and is the formal control framework supporting the company's pursuit of SOC 2 Type II and ISO 27001 certification, both required as IPO-readiness milestones to be completed by December 2026.

Scope: the ISMS covers all information processing systems, personnel, and physical sites involved in the operation of the Nova Platform, including: production AWS and GCP infrastructure (covered services: API gateway, application services in Kubernetes, PostgreSQL transactional layer, TimescaleDB telemetry, Elasticsearch search and log analytics, AI/ML EKS cluster); corporate IT systems supporting Engineering, SRE, Customer Success, Finance, HR, and Legal; the Bangalore primary office; and any third-party processor with access to customer data.

The Statement of Applicability (SoA) maintained on Confluence documents which of the 93 Annex A controls in ISO 27001:2022 are applicable, which are excluded with justification, and the implementation status of each. As of March 2026, 89 controls are applicable; 4 are documented as excluded (controls relating to specialised hardware development that TechNova does not perform); 70% of applicable controls are at a "fully implemented" maturity level; 25% are at "partially implemented"; 5% are documented as "planned" with target completion before December 2026.
"""),
    (2, "Information Asset Classification", """
TechNova classifies information assets into four sensitivity categories. All employees are trained on classification at onboarding and annually thereafter.

Class 1 - Public: information that is intentionally published and freely shareable. Examples: marketing collateral, public website content, published case studies. No specific handling controls.

Class 2 - Internal: information shared within TechNova and approved partners under NDA. Examples: org charts, internal documentation, non-customer-specific analytics. Default classification for new internal documents.

Class 3 - Confidential: information whose unauthorised disclosure would harm TechNova or its customers. Examples: customer lists, deal pipeline, source code, internal financial data, strategic plans. Encryption-at-rest required; access logged.

Class 4 - Restricted: information whose unauthorised disclosure could materially harm TechNova, customers, or third parties. Examples: customer personal data, customer-managed encryption keys, M&A targets, board-level financials, security incident details prior to public disclosure, all DRHP working materials. Class-4 data requires customer-managed-key encryption where applicable, access on a strict need-to-know basis logged with reason, and any access for non-routine purposes requires CISO approval.

Customer data inherits the Class-4 classification unless the customer's MSA explicitly permits a lower classification (none currently do).
"""),
    (3, "Access Control and Identity Management", """
Identity and access management is built on the principles of least privilege, separation of duties, and zero standing access for production systems.

All employee access to production systems is mediated through an identity-aware proxy (SSO via Okta) with mandatory hardware second factor (YubiKey or equivalent) for engineering staff. Standing privileged access to production has been eliminated as of January 2026 as part of the Zero Trust acceleration following INC-2025-0847; engineers request just-in-time access for up to 4 hours via a workflow that requires manager approval and is fully logged.

Customer data access by employees: Customer Success and Support staff have read-only access to customer-tenant data only when an active support ticket from that customer exists; access is automatically revoked 24 hours after ticket closure. Engineering staff do not have default access to production customer data; when an incident requires it, access is granted under break-glass procedure with CISO notification within 2 hours.

Vendor access: each vendor with access to TechNova systems has a named TechNova owner (the owner_department_id in the vendors table). Vendor access is reviewed quarterly by the owning department head. Suspended vendors (per the risk_status taxonomy) have access automatically disabled until risk-status is restored.
"""),
    (4, "Risk Management Methodology", """
TechNova's information security risk management follows the ISO 27005 framework adapted to the SaaS context.

Risk identification is performed quarterly by the CISO's office in collaboration with the SRE, Engineering, and Product Security teams. Identified risks are entered into the Risk Register on Confluence. The Risk Register currently contains 47 active risks as of March 2026.

Risk assessment uses a 5x5 likelihood-impact matrix. Likelihood (1-5): Rare, Unlikely, Possible, Likely, Almost Certain. Impact (1-5): Insignificant, Minor, Moderate, Major, Catastrophic. Inherent risk score = likelihood x impact (1-25). Residual risk score is calculated after considering existing controls.

Risk treatment options: Accept (residual <=6 with sign-off from the relevant department head), Mitigate (apply additional controls to reduce score), Transfer (cyber insurance currently provides INR 50 crore coverage for residual operational risk via the ICICI Lombard policy; the annual premium is INR 28 lakhs), or Avoid (discontinue the activity that creates the risk).

The current Risk Register top-5 by residual score: (i) AI infrastructure single-cluster concentration; (ii) data localisation non-compliance in Vietnam and Indonesia; (iii) Customer Revenue Officer single-point-of-failure; (iv) Capital expenditure variance in Engineering cloud spend; (v) Repeat security finding likelihood post INC-2025-0847.
"""),
    (5, "Incident Response Integration", """
The ISMS interlocks with the Security Incident Response Plan to ensure that detection, response, and post-incident learning feed back into control improvements.

Detection is multi-source: SIEM (Splunk Cloud) ingests logs from AWS CloudTrail, GCP Audit Logs, Okta, application logs, Elasticsearch query logs, and network security monitors. Detection rules are tuned monthly. The mean time to detect (MTTD) for SEV-1 and SEV-2 incidents is targeted at under 30 minutes; FY2025-26 actual was 22 minutes for SEV-1 and 38 minutes for SEV-2.

Response: incident classification follows the SEV-1/2/3/4 taxonomy from the OnCall Runbook. SEV-1 incidents (complete platform outage or all-customer data loss) require 5-minute response time. SEV-2 incidents (major degradation affecting more than 20 percent of customers) require 15-minute response. INC-2025-0847 was a SEV-2 affecting 847 customer accounts; response and CERT-In notification within 6 hours met regulatory expectations.

Post-incident: every SEV-1 and SEV-2 generates a Root Cause Analysis (RCA) within 5 business days, signed off by the CISO and CTO. The RCA produces a control-improvement set that is added to the ISMS work-stream backlog and tracked to closure in the Audit Findings table.
"""),
    (6, "Internal Audit and Continual Improvement", """
The ISMS is subject to an Internal Audit (IA) function reporting to the Audit Committee Chair (Dr. Vikram Reddy) with a dotted line to the CFO for operational matters. The IA Charter specifies independence from operational management of areas being audited.

The Internal Audit Plan FY2025-26 covers four domains in rotation: Engineering and Product (Q1), Finance and Procurement (Q2), HR and Compliance (Q3), and IT Operations and Security (Q4). The plan is approved annually by the Audit Committee. Critical or High findings from internal audit must be remediated within the timelines specified in the Audit Findings register; the IPO Committee tracks any finding flagged as ipo_blocker.

Management Review of the ISMS occurs semi-annually. The agenda includes: results of internal audits, results of external audits (SOC 2, ISO 27001, statutory), results of risk assessment, status of preventive and corrective actions, status of objectives, and recommendations for improvement. The minutes of Management Review are board-visible.

Continual improvement: the ISMS maintains an Improvement Backlog with 38 active items as of March 2026. Items range from "harden Okta MFA enrollment" (in progress) to "complete Vendor Risk Management automation" (planned for Q3 FY2026-27). Closed items contribute to the move toward "fully implemented" maturity on the Statement of Applicability.
"""),
]


def main():
    build_pdf(
        "TechNova_DRHP_Draft.pdf",
        {
            "title": "Draft Red Herring Prospectus (Working Draft v0.7)",
            "meta": "Office of the CFO and Company Secretary  |  March 2026  |  Working Draft for SEBI",
            "classification": "RESTRICTED — IPO Working Group Only",
        },
        DRHP_SECTIONS,
    )
    build_pdf(
        "TechNova_DR_BCP_Plan.pdf",
        {
            "title": "Disaster Recovery and Business Continuity Plan",
            "meta": "Site Reliability Engineering  |  Version 4.2  |  Last reviewed Q1 FY2026-27",
            "classification": "INTERNAL — Engineering and SRE Teams",
        },
        DR_SECTIONS,
    )
    build_pdf(
        "TechNova_AI_Governance_Framework.pdf",
        {
            "title": "AI Governance Framework",
            "meta": "Office of the CTO  |  Version 1.0  |  Approved by Board January 22, 2026",
            "classification": "INTERNAL — All Employees",
        },
        AI_SECTIONS,
    )
    build_pdf(
        "TechNova_Sales_Comp_Plan_FY25_26.pdf",
        {
            "title": "Sales Compensation Plan FY2025-26",
            "meta": "Office of the CRO  |  Version 1.3  |  Effective April 1, 2025 - March 31, 2026",
            "classification": "RESTRICTED — Sales Organisation and Compensation Committee Only",
        },
        SALES_SECTIONS,
    )
    build_pdf(
        "TechNova_ISMS_Policy.pdf",
        {
            "title": "Information Security Management System (ISMS) Policy",
            "meta": "Office of the CISO  |  Version 5.1  |  ISO 27001:2022 aligned",
            "classification": "INTERNAL — All Employees",
        },
        ISMS_SECTIONS,
    )


if __name__ == "__main__":
    main()
