"""
Teraval — verified Python reference model (source of truth for all numbers).

This is the canonical implementation of the Barq AI 40 MW AI/GPU data-center
capital-budgeting model. The TypeScript engine in web/src/finance/ is unit-tested
against these exact outputs (web/src/finance/finance.test.ts).

Run:  python docs/finance-model-reference.py
All monetary figures are AED millions unless noted.
"""
import numpy as np
import io
import contextlib

USD_AED = 3.6725
RACKS = 300
GPUS = RACKS * 72          # 21,600
IT_MW = 40.0
HOURS = 8760
LIFE = 8
TAX = 0.09                 # UAE corporate tax

it_hw = RACKS * 3.5 * USD_AED          # $3.5m/rack all-in
facility = IT_MW * 13.0 * USD_AED      # $13m/MW AI-grade build
capex0 = it_hw + facility
wc0 = 150.0


def irr_bisect(fcf):
    if len(fcf) < 2:               # a single flow (or none) has no return
        return float('nan')
    lo, hi = -0.95, 10.0
    f = lambda r: sum(cf / (1 + r) ** i for i, cf in enumerate(fcf))
    if f(lo) * f(hi) > 0 or (f(lo) == 0 and f(hi) == 0):
        return float('nan')
    for _ in range(300):
        mid = (lo + hi) / 2
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def run(price, util, tariff, pue, wacc, refresh_frac=0.5, refresh_year=4,
        fixed_opex=350.0, load=0.9, label="", verbose=True):
    rev = GPUS * HOURS * util * price * USD_AED / 1e6
    energy = IT_MW * pue * 1000 * HOURS * load * tariff / 1e6
    opex = energy + 0.05 * it_hw + fixed_opex
    ebitda = rev - opex
    refresh = refresh_frac * it_hw

    dep = np.zeros(LIFE + 1)
    for y in range(1, LIFE + 1):
        d = facility / 15.0
        if y <= 5:
            d += it_hw / 5.0
        if y > refresh_year:
            d += refresh / (LIFE - refresh_year)
        dep[y] = d

    terminal = facility * (1 - LIFE / 15.0) + wc0

    fcf = np.zeros(LIFE + 1)
    fcf[0] = -(capex0 + wc0)
    for y in range(1, LIFE + 1):
        ebit = ebitda - dep[y]
        tax = max(0.0, ebit) * TAX
        ocf = ebitda - tax
        f = ocf
        if y == refresh_year:
            f -= refresh
        if y == LIFE:
            f += terminal
        fcf[y] = f

    disc = np.array([1 / (1 + wacc) ** y for y in range(LIFE + 1)])
    npv = float(np.sum(fcf * disc))
    irr = irr_bisect(fcf)
    pv_in = float(np.sum(fcf[1:] * disc[1:]))
    pi = pv_in / (capex0 + wc0)

    cum = np.cumsum(fcf)
    pb = next((y - 1 + (-cum[y - 1] / fcf[y]) for y in range(1, LIFE + 1)
               if cum[y] >= 0 and fcf[y] > 0), None)
    dcum = np.cumsum(fcf * disc)
    dpb = next((y - 1 + (-dcum[y - 1] / (fcf[y] * disc[y])) for y in range(1, LIFE + 1)
                if dcum[y] >= 0 and fcf[y] > 0), None)

    neg = sum(fcf[y] * disc[y] for y in range(LIFE + 1) if fcf[y] < 0)
    pos = sum(fcf[y] * (1 + wacc) ** (LIFE - y) for y in range(LIFE + 1) if fcf[y] > 0)
    # needs both an outflow and an inflow (mirrors the TS engine's guard)
    mirr = float('nan') if neg == 0 or pos == 0 else (pos / (-neg)) ** (1 / LIFE) - 1

    if verbose:
        pbs = 'never' if pb is None else f'{pb:.1f}y'
        dpbs = 'never' if dpb is None else f'{dpb:.1f}y'
        irrs = 'n/a' if irr != irr else f'{irr:.1%}'
        print(f"=== {label} ===  price ${price}/hr util {util:.0%} tariff {tariff} PUE {pue} WACC {wacc:.0%}")
        print(f"  Rev AED {rev:,.0f}M | Opex {opex:,.0f}M (energy {energy:,.0f}) | EBITDA {ebitda:,.0f}M")
        print(f"  NPV AED {npv:,.0f}M | IRR {irrs} | MIRR {mirr:.1%} | PI {pi:.2f} | Payback {pbs} | DiscPB {dpbs}")
    return npv


if __name__ == "__main__":
    print(f"Capex Y0: AED {capex0:,.0f}M (${capex0 / USD_AED:,.0f}M = ${capex0 / USD_AED / IT_MW:.1f}M/MW) | GPUs {GPUS:,}\n")
    run(4.0, 0.80, 0.15, 1.20, 0.09, label="BASE")
    run(6.0, 0.90, 0.13, 1.15, 0.08, label="OPTIMISTIC")
    run(2.5, 0.65, 0.20, 1.30, 0.11, label="PESSIMISTIC")

    lo, hi = 1.0, 4.0
    for _ in range(50):
        mid = (lo + hi) / 2
        with contextlib.redirect_stdout(io.StringIO()):
            npv = run(mid, 0.80, 0.15, 1.20, 0.09, verbose=False)
        if npv > 0:
            hi = mid
        else:
            lo = mid
    print(f"\nBreakeven GPU rental price (base conditions): ~${(lo + hi) / 2:.2f}/GPU-hr")
