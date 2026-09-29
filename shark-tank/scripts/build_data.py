#!/usr/bin/env python3
"""Merge data/raw/s*.csv into the files the website reads.

Outputs:
  data/pitches.js    -> window.PITCHES = [...]   (loaded by index.html; works even from file://)
  data/pitches.json  -> same records as JSON (for anyone who wants the data)
  data/pitches.csv   -> merged CSV of all seasons (the "Download data" link)

Run from the project root:  python3 scripts/build_data.py
"""
import csv
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(ROOT, "data")

FIELDS = ["season", "episode", "pitch_no", "brand", "idea", "city",
          "ask_amount_lakh", "ask_equity_pct", "deal",
          "deal_equity_amount_lakh", "deal_debt_lakh", "deal_equity_pct",
          "royalty_or_other", "sharks"]


def num(v):
    v = (v or "").strip()
    if not v:
        return None
    try:
        return float(v)
    except ValueError:
        return None


def valuation(amount, pct):
    """Implied valuation in lakh; None if it can't be computed meaningfully."""
    if amount is None or pct is None or pct <= 0 or amount < 1:
        return None
    return round(amount * 100 / pct, 2)


def main():
    rows = []
    for path in sorted(glob.glob(os.path.join(RAW, "s*.csv"))):
        with open(path, newline="", encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                season = int(r["season"])
                ep = r.get("episode", "").strip()
                ask_amt = num(r["ask_amount_lakh"])
                ask_eq = num(r["ask_equity_pct"])
                is_deal = r["deal"].strip().lower() == "yes"
                eq_amt = num(r["deal_equity_amount_lakh"]) if is_deal else None
                debt = (num(r["deal_debt_lakh"]) or 0) if is_deal else None
                deal_eq = num(r["deal_equity_pct"]) if is_deal else None
                sharks = [s.strip() for s in (r["sharks"] or "").split(";") if s.strip()]
                ask_val = valuation(ask_amt, ask_eq)
                # Deal valuation uses the equity cheque only. Deals where debt is larger
                # than the equity cheque are "structured" and left out of valuation maths.
                structured = bool(is_deal and debt and eq_amt is not None and debt > eq_amt)
                deal_val = None if structured else valuation(eq_amt, deal_eq)
                rows.append({
                    "s": season,
                    "ep": int(ep) if ep.isdigit() else None,
                    "no": int(r["pitch_no"]),
                    "brand": r["brand"].strip(),
                    "idea": r["idea"].strip(),
                    "city": r["city"].strip(),
                    "askAmt": ask_amt,
                    "askEq": ask_eq,
                    "askVal": ask_val,
                    "deal": is_deal,
                    "dealAmt": eq_amt,
                    "debt": debt,
                    "dealEq": deal_eq,
                    "dealVal": deal_val,
                    "note": r["royalty_or_other"].strip(),
                    "sharks": sharks,
                })

    rows.sort(key=lambda x: (x["s"], x["no"]))

    with open(os.path.join(OUT, "pitches.json"), "w", encoding="utf-8") as fh:
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT, "pitches.js"), "w", encoding="utf-8") as fh:
        fh.write("window.PITCHES=")
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    with open(os.path.join(OUT, "pitches.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        for path in sorted(glob.glob(os.path.join(RAW, "s*.csv"))):
            with open(path, newline="", encoding="utf-8") as src:
                for r in csv.DictReader(src):
                    w.writerow({k: r.get(k, "") for k in FIELDS})

    by = {}
    for r in rows:
        by.setdefault(r["s"], [0, 0])
        by[r["s"]][0] += 1
        by[r["s"]][1] += r["deal"]
    for s, (n, d) in sorted(by.items()):
        print(f"Season {s}: {n} pitches, {d} deals")
    print(f"Total: {len(rows)} pitches")


if __name__ == "__main__":
    main()
