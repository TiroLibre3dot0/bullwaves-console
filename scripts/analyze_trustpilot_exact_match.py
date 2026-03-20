from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set


ROOT = Path(__file__).resolve().parents[1]
TRUSTPILOT_CSV = ROOT / "Trustpilot" / "TrustPilot Review Tracker.csv"
REGISTRATIONS_CSV = ROOT / "public" / "Registrations Report.csv"
SUPPORT_INDEX_JSON = ROOT / "public" / "support_users_index.json"
OUT_JSON = ROOT / "artifacts" / "raw" / "trustpilot_exact_match_report.json"


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip()).lower()


def clean_userid(value: str) -> str:
    # Registrations can contain trailing escape/quote artifacts like bullwaves-12345\"
    txt = (value or "").strip()
    txt = re.sub(r"[\"\\]+$", "", txt)
    return norm(txt)


def load_csv(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def get_existing_col(row: Dict[str, str], options: List[str]) -> str:
    lower_map = {k.lower(): k for k in row.keys()}
    for opt in options:
        if opt.lower() in lower_map:
            return lower_map[opt.lower()]
    return ""


def collect_values(rows: List[Dict[str, str]], col_options: List[str]) -> Set[str]:
    if not rows:
        return set()
    col = get_existing_col(rows[0], col_options)
    if not col:
        return set()
    values = set()
    for r in rows:
        v = norm(r.get(col, ""))
        if v:
            values.add(v)
    return values


def collect_values_with_lines(rows: List[Dict[str, str]], col_options: List[str]) -> Dict[str, List[int]]:
    if not rows:
        return {}
    col = get_existing_col(rows[0], col_options)
    if not col:
        return {}
    out: Dict[str, List[int]] = defaultdict(list)
    for i, r in enumerate(rows, start=2):
        v = norm(r.get(col, ""))
        if v:
            out[v].append(i)
    return out


def main() -> None:
    trust_rows = load_csv(TRUSTPILOT_CSV)
    reg_rows = load_csv(REGISTRATIONS_CSV)

    support_blob = json.loads(SUPPORT_INDEX_JSON.read_text(encoding="utf-8"))
    support_rows = support_blob.get("rows", []) if isinstance(support_blob, dict) else []

    trust_cols = list(trust_rows[0].keys()) if trust_rows else []
    reg_cols = list(reg_rows[0].keys()) if reg_rows else []
    support_cols = list(support_rows[0].keys()) if support_rows else []

    # Candidate identity fields
    trust_name_map = collect_values_with_lines(trust_rows, ["Reviewer Name", "Name", "Username"])
    trust_lead_map = collect_values_with_lines(trust_rows, ["Potential Lead", "PotentialLead"])
    trust_assigned_map = collect_values_with_lines(trust_rows, ["Assigned To", "AssignedTo"])
    trust_link_map = collect_values_with_lines(trust_rows, ["Trustpilot Link", "Link"])

    reg_userid = collect_values(
        reg_rows, ["user_id", "User ID", "UserID", "userid", "id"]
    )
    reg_name = collect_values(
        reg_rows, ["customer_name", "Name", "Full Name", "User Name", "Username"]
    )
    reg_email = collect_values(reg_rows, ["Email", "E-mail"])
    reg_mt5 = collect_values(
        reg_rows,
        ["mt5_account", "MT5", "MT5 Account", "MT5Account", "Account", "Account ID"],
    )

    support_userid = {norm(str(r.get("userid", ""))) for r in support_rows if norm(str(r.get("userid", "")))}
    support_mt5 = {norm(str(r.get("mt5account", ""))) for r in support_rows if norm(str(r.get("mt5account", "")))}
    support_name = {
        norm(str(r.get("customername", "")))
        for r in support_rows
        if norm(str(r.get("customername", "")))
    }

    # Name -> user ids mappings for exact identity resolution checks
    reg_name_to_userids: Dict[str, Set[str]] = defaultdict(set)
    for r in reg_rows:
        n = norm(r.get("customer_name", ""))
        uid = clean_userid(r.get("user_id", ""))
        if n and uid:
            reg_name_to_userids[n].add(uid)

    support_name_to_userids: Dict[str, Set[str]] = defaultdict(set)
    for r in support_rows:
        n = norm(str(r.get("customername", "")))
        uid = norm(str(r.get("userid", "")))
        if n and uid:
            support_name_to_userids[n].add(uid)

    # Exact match tests
    trust_name_values = set(trust_name_map.keys())
    trust_lead_values = set(trust_lead_map.keys())
    trust_assigned_values = set(trust_assigned_map.keys())

    exact = {
        "trust_reviewer_name_vs_reg_name": sorted(trust_name_values & reg_name),
        "trust_reviewer_name_vs_support_name": sorted(trust_name_values & support_name),
        "trust_potential_lead_vs_reg_userid": sorted(trust_lead_values & reg_userid),
        "trust_potential_lead_vs_support_userid": sorted(trust_lead_values & support_userid),
        "trust_potential_lead_vs_reg_email": sorted(trust_lead_values & reg_email),
        "trust_potential_lead_vs_reg_mt5": sorted(trust_lead_values & reg_mt5),
        "trust_potential_lead_vs_support_mt5": sorted(trust_lead_values & support_mt5),
        "trust_assigned_to_vs_reg_userid": sorted(trust_assigned_values & reg_userid),
        "trust_assigned_to_vs_support_userid": sorted(trust_assigned_values & support_userid),
    }

    # Build examples with Trustpilot line numbers for each non-empty match set
    examples: Dict[str, List[Dict[str, object]]] = {}
    for key, vals in exact.items():
        if not vals:
            continue
        source_map = trust_name_map
        if key.startswith("trust_potential_lead"):
            source_map = trust_lead_map
        elif key.startswith("trust_assigned_to"):
            source_map = trust_assigned_map

        sample = []
        for v in vals[:30]:
            sample.append({"value": v, "trustpilot_lines": source_map.get(v, [])[:10]})
        examples[key] = sample

    # Exact identity resolution quality for reviewer-name matches
    reviewer_resolution = {
        "reviewer_names_total": len(trust_name_values),
        "reviewer_names_found_in_registrations": 0,
        "reviewer_names_found_in_support": 0,
        "reviewer_names_one_to_one_registrations": 0,
        "reviewer_names_one_to_one_support": 0,
        "reviewer_names_one_to_one_both_same_userid": 0,
        "reviewer_names_ambiguous_registrations": 0,
        "reviewer_names_ambiguous_support": 0,
        "reviewer_names_missing_everywhere": 0,
        "samples_one_to_one_both_same_userid": [],
        "samples_ambiguous_registrations": [],
        "samples_ambiguous_support": [],
    }

    for name in sorted(trust_name_values):
        reg_ids = reg_name_to_userids.get(name, set())
        sup_ids = support_name_to_userids.get(name, set())

        if reg_ids:
            reviewer_resolution["reviewer_names_found_in_registrations"] += 1
        if sup_ids:
            reviewer_resolution["reviewer_names_found_in_support"] += 1

        if len(reg_ids) == 1:
            reviewer_resolution["reviewer_names_one_to_one_registrations"] += 1
        if len(sup_ids) == 1:
            reviewer_resolution["reviewer_names_one_to_one_support"] += 1

        if len(reg_ids) > 1:
            reviewer_resolution["reviewer_names_ambiguous_registrations"] += 1
            if len(reviewer_resolution["samples_ambiguous_registrations"]) < 20:
                reviewer_resolution["samples_ambiguous_registrations"].append(
                    {"name": name, "registration_userids": sorted(reg_ids)[:10]}
                )

        if len(sup_ids) > 1:
            reviewer_resolution["reviewer_names_ambiguous_support"] += 1
            if len(reviewer_resolution["samples_ambiguous_support"]) < 20:
                reviewer_resolution["samples_ambiguous_support"].append(
                    {"name": name, "support_userids": sorted(sup_ids)[:10]}
                )

        if len(reg_ids) == 1 and len(sup_ids) == 1:
            reg_id = next(iter(reg_ids))
            sup_id = next(iter(sup_ids))
            if reg_id == sup_id:
                reviewer_resolution["reviewer_names_one_to_one_both_same_userid"] += 1
                if len(reviewer_resolution["samples_one_to_one_both_same_userid"]) < 20:
                    reviewer_resolution["samples_one_to_one_both_same_userid"].append(
                        {"name": name, "userid": reg_id, "trustpilot_lines": trust_name_map.get(name, [])[:10]}
                    )

        if not reg_ids and not sup_ids:
            reviewer_resolution["reviewer_names_missing_everywhere"] += 1

    # Quick diagnostics for why exact matching may fail
    diagnostics = {
        "trustpilot_rows": len(trust_rows),
        "registrations_rows": len(reg_rows),
        "support_rows": len(support_rows),
        "trustpilot_non_empty_reviewer_name": len(trust_name_values),
        "trustpilot_non_empty_potential_lead": len(trust_lead_values),
        "trustpilot_non_empty_assigned_to": len(trust_assigned_values),
        "registrations_non_empty_userid": len(reg_userid),
        "registrations_non_empty_name": len(reg_name),
        "registrations_non_empty_email": len(reg_email),
        "registrations_non_empty_mt5": len(reg_mt5),
        "support_non_empty_userid": len(support_userid),
        "support_non_empty_name": len(support_name),
        "support_non_empty_mt5": len(support_mt5),
        "trustpilot_non_empty_trustpilot_link": len(set(trust_link_map.keys())),
        "trustpilot_potential_lead_values": sorted(trust_lead_values),
        "trustpilot_assigned_to_values": sorted(trust_assigned_values),
    }

    match_counts = {k: len(v) for k, v in exact.items()}

    out = {
        "files": {
            "trustpilot": str(TRUSTPILOT_CSV),
            "registrations": str(REGISTRATIONS_CSV),
            "support_index": str(SUPPORT_INDEX_JSON),
        },
        "columns": {
            "trustpilot": trust_cols,
            "registrations": reg_cols,
            "support_index_rows": support_cols,
        },
        "diagnostics": diagnostics,
        "exact_match_counts": match_counts,
        "exact_match_examples": examples,
        "reviewer_name_identity_resolution": reviewer_resolution,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(str(OUT_JSON))


if __name__ == "__main__":
    main()