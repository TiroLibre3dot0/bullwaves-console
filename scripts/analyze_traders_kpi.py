"""
Analisi KPI dal file Traders Ranking Rewards.xlsx
Output: JSON con i principali indicatori per rispondere al brief marketing.
"""
import pandas as pd
import json
import warnings
warnings.filterwarnings("ignore")

FILE = r"C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\CREOLABS\Traders Ranking Rewards.xlsx"
OUT  = r"C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\artifacts\traders_kpi_analysis.json"

print("Caricamento file...")
df = pd.read_excel(FILE, dtype=str)
print(f"Shape: {df.shape}")
print(f"Colonne: {df.columns.tolist()}")

# --- normalizza nomi colonne ---
df.columns = [c.strip() for c in df.columns]

# --- conversioni numeriche ---
NUM_COLS = ["$ Balance","LTV Commission","$ Closed PL","$ Open PL",
            "# Trades","$ FTD","$ RDP","$ Deposit","$ WD","$ Net","$ Equity"]
for col in NUM_COLS:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col].str.replace(",",".", regex=False), errors="coerce")

# Colonna periodo
if "Year Month" in df.columns:
    df["Year Month"] = df["Year Month"].astype(str).str.strip()

result = {}

# ---- 1. OVERVIEW GENERALE ----
result["overview"] = {
    "total_rows": int(len(df)),
    "unique_clients": int(df["Client ID"].nunique()) if "Client ID" in df.columns else None,
    "unique_affiliates": int(df["Affiliate ID"].nunique()) if "Affiliate ID" in df.columns else None,
    "unique_countries": int(df["Country"].nunique()) if "Country" in df.columns else None,
    "date_range_yearmonth": sorted(df["Year Month"].dropna().unique().tolist())[-6:] if "Year Month" in df.columns else None,
}

# ---- 2. KPI FINANZIARI ----
def safe_sum(col): return round(float(df[col].sum()), 2) if col in df.columns else None
def safe_mean(col): return round(float(df[col].mean()), 2) if col in df.columns else None
def safe_median(col): return round(float(df[col].median()), 2) if col in df.columns else None
def safe_max(col): return round(float(df[col].max()), 2) if col in df.columns else None

result["financials"] = {
    "total_deposit_usd": safe_sum("$ Deposit"),
    "total_ftd_usd": safe_sum("$ FTD"),
    "total_closed_pl_usd": safe_sum("$ Closed PL"),
    "total_open_pl_usd": safe_sum("$ Open PL"),
    "total_net_usd": safe_sum("$ Net"),
    "total_wd_usd": safe_sum("$ WD"),
    "total_balance_usd": safe_sum("$ Balance"),
    "total_equity_usd": safe_sum("$ Equity"),
    "avg_balance_per_client": safe_mean("$ Balance"),
    "median_balance": safe_median("$ Balance"),
    "max_balance": safe_max("$ Balance"),
    "avg_ftd": safe_mean("$ FTD"),
    "avg_closed_pl": safe_mean("$ Closed PL"),
    "total_trades": safe_sum("# Trades"),
    "avg_trades_per_client": safe_mean("# Trades"),
}

# ---- 3. TOP COUNTRIES ----
if "Country" in df.columns and "Client ID" in df.columns:
    by_country = df.groupby("Country")["Client ID"].nunique().sort_values(ascending=False).head(15)
    result["top_countries_by_clients"] = {str(k): int(v) for k, v in by_country.items()}

# ---- 4. TOP COUNTRIES PER DEPOSIT ----
if "Country" in df.columns and "$ Deposit" in df.columns:
    dep_by_country = df.groupby("Country")["$ Deposit"].sum().sort_values(ascending=False).head(10)
    result["top_countries_by_deposit"] = {str(k): round(float(v), 2) for k, v in dep_by_country.items()}

# ---- 5. CLIENTI ATTIVI (almeno 1 trade) ----
if "# Trades" in df.columns:
    active = df[df["# Trades"] > 0]
    result["active_traders"] = {
        "count": int(active["Client ID"].nunique()) if "Client ID" in active.columns else int(len(active)),
        "avg_trades": round(float(active["# Trades"].mean()), 1),
        "avg_closed_pl": round(float(active["$ Closed PL"].mean()), 2) if "$ Closed PL" in active.columns else None,
        "avg_balance": round(float(active["$ Balance"].mean()), 2) if "$ Balance" in active.columns else None,
    }

# ---- 6. TOP TRADERS PER P&L (clienti unici aggreati per ID) ----
if "$ Closed PL" in df.columns and "Client ID" in df.columns:
    top_pl = (df.groupby(["Client ID","Client Name","Country"])["$ Closed PL"]
              .sum().sort_values(ascending=False).head(10).reset_index())
    result["top10_traders_by_closed_pl"] = top_pl.to_dict(orient="records")

# ---- 7. FTD DISTRIBUTION ----
if "$ FTD" in df.columns:
    ftd = df[df["$ FTD"] > 0]["$ FTD"]
    result["ftd_distribution"] = {
        "count_with_ftd": int(len(ftd)),
        "avg": round(float(ftd.mean()), 2),
        "median": round(float(ftd.median()), 2),
        "max": round(float(ftd.max()), 2),
        "p75": round(float(ftd.quantile(0.75)), 2),
        "p90": round(float(ftd.quantile(0.90)), 2),
    }

# ---- 8. TREND MENSILE (ultimi 12 mesi) ----
if "Year Month" in df.columns and "$ Deposit" in df.columns:
    monthly = (df.groupby("Year Month")
               .agg(deposits=("$ Deposit","sum"),
                    new_clients=("Client ID","nunique"),
                    trades=("# Trades","sum"))
               .sort_index().tail(12))
    result["monthly_trend_last12"] = {
        str(k): {
            "deposits": round(float(v["deposits"]), 2),
            "clients": int(v["new_clients"]),
            "trades": int(v["trades"]),
        }
        for k, v in monthly.iterrows()
    }

# ---- 9. BALANCE TIERS (segmentazione VIP) ----
if "$ Balance" in df.columns:
    bal = df[df["$ Balance"] > 0]["$ Balance"]
    tiers = {
        "< 500": int((bal < 500).sum()),
        "500-2000": int(((bal >= 500) & (bal < 2000)).sum()),
        "2000-10000": int(((bal >= 2000) & (bal < 10000)).sum()),
        "10000-50000": int(((bal >= 10000) & (bal < 50000)).sum()),
        "> 50000": int((bal >= 50000).sum()),
    }
    result["balance_tiers"] = tiers

# ---- SAVE ----
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False, default=str)

print(f"\nAnalisi completata. Output: {OUT}")
print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
