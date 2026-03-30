"""
Fast xlsx aggregation using direct ZIP/XML parsing.
No pandas/openpyxl needed - streams the sheet XML directly.
Output: JSON KPI report for marketing analysis.
"""
import signal
signal.signal(signal.SIGINT,  signal.SIG_IGN)  # Ignore CTRL+C from parent shells
signal.signal(signal.SIGBREAK, signal.SIG_IGN) # Ignore CTRL+BREAK

import zipfile, xml.etree.ElementTree as ET
import json, re, shutil, os, sys
from collections import defaultdict

SRC = r"C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\CREOLABS\Traders Ranking Rewards.xlsx"
TMP = r"C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\artifacts\_tmp_traders.xlsx"
OUT = r"C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_new\artifacts\traders_kpi_analysis.json"

# Copy file (in case Excel has it open — xlsx allows concurrent reads via copy)
print("Copying file...")
shutil.copy2(SRC, TMP)
print("Done.")

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

def tag(name): return f"{{{NS}}}{name}"

print("Loading shared strings...")
with zipfile.ZipFile(TMP) as z:
    names = z.namelist()
    # Shared strings
    ss = []
    if "xl/sharedStrings.xml" in names:
        with z.open("xl/sharedStrings.xml") as f:
            tree = ET.parse(f)
            for si in tree.getroot().findall(f".//{tag('si')}"):
                texts = [t.text or "" for t in si.findall(f".//{tag('t')}")]
                ss.append("".join(texts))
    print(f"Shared strings: {len(ss)}")

    # Find sheet file
    sheet_file = None
    for n in names:
        if re.match(r"xl/worksheets/sheet\d+\.xml$", n):
            sheet_file = n
            break
    print(f"Sheet file: {sheet_file}")

    # --- Stream parse sheet ---
    print("Parsing sheet XML...")

    # We need to determine column indices from header row
    COL_MAP = {}  # col_letter -> index (0-based)
    HEADER = {}   # col_index (0-based) -> field_name
    
    def col_letter_to_idx(col_str):
        """Convert Excel column letters to 0-based index."""
        idx = 0
        for ch in col_str.upper():
            idx = idx * 26 + (ord(ch) - ord('A') + 1)
        return idx - 1

    def cell_ref_to_col(ref):
        m = re.match(r"([A-Z]+)(\d+)", ref)
        if m:
            return col_letter_to_idx(m.group(1)), int(m.group(2))
        return None, None

    def get_val(cell_el, ss_list):
        t = cell_el.get("t", "")
        v_el = cell_el.find(tag("v"))
        if v_el is None or v_el.text is None:
            return ""
        raw = v_el.text
        if t == "s":
            try: return ss_list[int(raw)]
            except: return raw
        return raw

    # Accumulators
    total_deposit = total_ftd = total_closed_pl = 0.0
    total_open_pl = total_net = total_wd = 0.0
    total_balance = total_equity = 0.0
    total_trades = 0
    max_balance = max_closed_pl = max_ftd = 0.0

    client_set     = set()
    affiliate_set  = set()
    country_rows   = defaultdict(int)
    country_dep    = defaultdict(float)
    monthly_dep    = defaultdict(float)
    monthly_cli    = defaultdict(set)
    monthly_tr     = defaultdict(int)

    t0=t1=t2=t3=t4 = 0  # balance tiers
    count_with_ftd = ftd_sum2 = 0
    ftd_sample = []  # for percentiles (max 50k)

    active_cli_set = set()
    active_count = active_trades_sum = 0
    active_pl_sum = active_bal_sum = 0.0

    client_pl   = defaultdict(float)
    client_name = {}
    client_ctry = {}

    row_count = 0
    col_idx = {}  # field_name -> col_idx (0-based)

    with zipfile.ZipFile(TMP) as z2:
        with z2.open(sheet_file) as f:
            context = ET.iterparse(f, events=("end",))
            current_row = {}
            current_row_num = 0

            for event, elem in context:
                if elem.tag == tag("c"):
                    ref = elem.get("r", "")
                    ci, ri = cell_ref_to_col(ref)
                    if ci is not None:
                        val = get_val(elem, ss)
                        current_row[ci] = val
                        current_row_num = ri
                    elem.clear()

                elif elem.tag == tag("row"):
                    rn = int(elem.get("r", current_row_num))

                    if rn == 1:
                        # Parse headers
                        for ci, v in current_row.items():
                            v = str(v).strip()
                            col_idx[v] = ci
                        print(f"Headers found: {list(col_idx.keys())}")

                    else:
                        row_count += 1
                        if row_count % 20000 == 0:
                            print(f"  Processed {row_count} rows...")

                        def gc(name):
                            ci = col_idx.get(name)
                            if ci is None: return ""
                            return current_row.get(ci, "")

                        def gn(name):
                            v = gc(name)
                            if v == "" or v is None: return 0.0
                            try: return float(str(v).replace(",", "."))
                            except: return 0.0

                        cid = str(gc("Client ID")).strip()
                        aid = str(gc("Affiliate ID")).strip()
                        cty = str(gc("Country")).strip()
                        cname = str(gc("Client Name")).strip()
                        ym   = str(gc("Year Month")).strip()

                        bal = gn("$ Balance")
                        cpl = gn("$ Closed PL")
                        opl = gn("$ Open PL")
                        tr  = int(gn("# Trades"))
                        ftd = gn("$ FTD")
                        dep = gn("$ Deposit")
                        wd  = gn("$ WD")
                        net = gn("$ Net")
                        eq  = gn("$ Equity")

                        if cid: client_set.add(cid)
                        if aid: affiliate_set.add(aid)

                        total_deposit  += dep;  total_ftd      += ftd
                        total_closed_pl+= cpl;  total_open_pl  += opl
                        total_net      += net;  total_wd       += wd
                        total_balance  += bal;  total_equity   += eq
                        total_trades   += tr

                        if bal > max_balance: max_balance = bal
                        if cpl > max_closed_pl: max_closed_pl = cpl

                        if ftd > 0:
                            count_with_ftd += 1
                            ftd_sum2 += ftd
                            if ftd > max_ftd: max_ftd = ftd
                            if len(ftd_sample) < 50000: ftd_sample.append(ftd)

                        if bal > 0:
                            if bal < 500:             t0 += 1
                            elif bal < 2000:          t1 += 1
                            elif bal < 10000:         t2 += 1
                            elif bal < 50000:         t3 += 1
                            else:                     t4 += 1

                        if cty:
                            country_rows[cty] += 1
                            country_dep[cty]  += dep

                        if ym:
                            monthly_dep[ym] += dep
                            monthly_tr[ym]  += tr
                            if cid: monthly_cli[ym].add(cid)

                        if tr > 0:
                            active_count      += 1
                            active_trades_sum += tr
                            active_pl_sum     += cpl
                            active_bal_sum    += bal
                            if cid: active_cli_set.add(cid)

                        if cid:
                            client_pl[cid] += cpl
                            if cid not in client_name:
                                client_name[cid] = cname
                                client_ctry[cid] = cty

                    current_row = {}
                    elem.clear()

print(f"Total data rows processed: {row_count}")

# FTD percentiles
ftd_sample.sort()
def percentile(lst, p):
    if not lst: return 0.0
    idx = int(len(lst) * p)
    return round(lst[min(idx, len(lst)-1)], 2)

avg_ftd = round(ftd_sum2 / count_with_ftd, 2) if count_with_ftd else 0

# Top countries
top_ctry_rows = sorted(country_rows.items(), key=lambda x: -x[1])[:15]
top_ctry_dep  = sorted(country_dep.items(),  key=lambda x: -x[1])[:10]

# Top 10 by P&L
top10_pl = sorted(client_pl.items(), key=lambda x: -x[1])[:10]

# Monthly last 12
month_keys = sorted(monthly_dep.keys())[-12:]

n_clients = len(client_set)

result = {
    "overview": {
        "total_data_rows": row_count,
        "unique_clients": n_clients,
        "unique_affiliates": len(affiliate_set),
        "unique_countries": len(country_rows),
    },
    "financials": {
        "total_deposit_usd": round(total_deposit, 2),
        "total_ftd_usd": round(total_ftd, 2),
        "total_closed_pl_usd": round(total_closed_pl, 2),
        "total_open_pl_usd": round(total_open_pl, 2),
        "total_net_usd": round(total_net, 2),
        "total_wd_usd": round(total_wd, 2),
        "total_balance_usd": round(total_balance, 2),
        "total_equity_usd": round(total_equity, 2),
        "total_trades": total_trades,
        "max_balance_single_client": round(max_balance, 2),
        "max_closed_pl_single_client": round(max_closed_pl, 2),
        "avg_balance_per_client_row": round(total_balance / row_count, 2) if row_count else 0,
        "avg_closed_pl_per_client_row": round(total_closed_pl / row_count, 2) if row_count else 0,
    },
    "ftd_distribution": {
        "clients_with_ftd": count_with_ftd,
        "avg_ftd": avg_ftd,
        "median_ftd": percentile(ftd_sample, 0.50),
        "p75_ftd": percentile(ftd_sample, 0.75),
        "p90_ftd": percentile(ftd_sample, 0.90),
        "max_ftd": round(max_ftd, 2),
    },
    "active_traders": {
        "unique_active_clients": len(active_cli_set),
        "total_active_rows": active_count,
        "avg_trades_per_active_row": round(active_trades_sum / active_count, 1) if active_count else 0,
        "avg_closed_pl_active": round(active_pl_sum / active_count, 2) if active_count else 0,
        "avg_balance_active": round(active_bal_sum / active_count, 2) if active_count else 0,
    },
    "balance_tiers": {
        "lt_500": t0,
        "500_to_2000": t1,
        "2000_to_10000": t2,
        "10000_to_50000": t3,
        "gt_50000": t4,
    },
    "top15_countries_by_rows": [{"country": k, "rows": v} for k, v in top_ctry_rows],
    "top10_countries_by_deposit": [{"country": k, "deposit_usd": round(v, 2)} for k, v in top_ctry_dep],
    "top10_by_closed_pl": [
        {"client_id": cid, "name": client_name.get(cid, ""), "country": client_ctry.get(cid, ""), "closed_pl": round(pl, 2)}
        for cid, pl in top10_pl
    ],
    "monthly_trend_last12": [
        {"period": ym, "deposits": round(monthly_dep[ym], 2),
         "unique_clients": len(monthly_cli.get(ym, set())),
         "trades": monthly_tr.get(ym, 0)}
        for ym in month_keys
    ],
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
print(f"SAVED: {OUT}")
print(json.dumps(result, indent=2, ensure_ascii=False))

# Cleanup temp
try: os.remove(TMP)
except: pass
print("DONE")
