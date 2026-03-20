import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN_PATH = ROOT / "Trustpilot" / "TrustPilot Review Tracker.csv"
NORMALIZED_PATH = ROOT / "Trustpilot" / "TrustPilot Review Tracker.normalized.csv"
DEDUP_PATH = ROOT / "Trustpilot" / "TrustPilot Review Tracker.dedup.csv"
REPORT_PATH = ROOT / "Trustpilot" / "trustpilot_cleanup_report.json"

DATE_FORMAT = "%b %d, %Y"

MONTH_TYPO_REPLACEMENTS = {
    "septemer": "September",
    "spetember": "September",
}

MONTH_NAME_FIXUPS = {
    "septemer": "September",
    "spetember": "September",
    "september": "September",
}

ISSUE_TYPE_NORMALIZATION = {
    "supprot": "Support",
    "others": "Other",
}

STATUS_SCORE = {
    "": 0,
    "pending": 1,
    "reviewed": 2,
    "replied": 3,
    "escalated": 4,
    "closed": 5,
}


def clean_text(value: str) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_issue_type(value: str) -> str:
    s = clean_text(value)
    if not s:
        return ""
    lowered = s.lower()
    if lowered in ISSUE_TYPE_NORMALIZATION:
        return ISSUE_TYPE_NORMALIZATION[lowered]
    return s


def normalize_date_text(raw: str):
    s = clean_text(raw)
    if not s:
        return "", False, False

    changed = False

    # Normalize first month token with a robust alpha-only lookup.
    m = re.match(r"^\s*([A-Za-z]+)(.*)$", s)
    if m:
      month_token = m.group(1)
      rest = m.group(2)
      month_key = month_token.lower()
      fixed_month = MONTH_NAME_FIXUPS.get(month_key)
      if fixed_month and fixed_month != month_token:
          s = fixed_month + rest
          changed = True

    # Fix common month misspellings.
    for wrong, right in MONTH_TYPO_REPLACEMENTS.items():
        pattern = re.compile(r"\b" + re.escape(wrong) + r"\b", re.IGNORECASE)
        if pattern.search(s):
            s = pattern.sub(right, s)
            changed = True

    # Normalize separators/spaces around comma: "Septemer 01,2025" -> "September 01, 2025"
    s2 = re.sub(r"\s*,\s*", ", ", s)
    if s2 != s:
        s = s2
        changed = True

    # Ensure month abbreviation expected by parser by using full->abbr fallback.
    parsed = None
    parse_ok = False

    # Try abbreviated format first.
    for fmt in ("%b %d, %Y", "%B %d, %Y"):
        try:
            parsed = datetime.strptime(s, fmt)
            parse_ok = True
            break
        except ValueError:
            pass

    if not parse_ok:
        return s, changed, False

    # Canonical output keeps abbreviated month for consistency.
    normalized = parsed.strftime(DATE_FORMAT)
    if normalized != s:
        changed = True
    return normalized, changed, True


def row_quality_score(row: dict) -> float:
    non_empty = sum(1 for v in row.values() if clean_text(v) != "")
    status = clean_text(row.get("Status", "")).lower()
    status_score = STATUS_SCORE.get(status, 0)
    follow_up_len = len(clean_text(row.get("Follow-up Notes", "")))
    return status_score * 1000 + non_empty * 10 + min(follow_up_len, 300)


def merge_rows(base: dict, other: dict) -> dict:
    out = dict(base)
    for k, v in other.items():
        if clean_text(out.get(k, "")) == "" and clean_text(v) != "":
            out[k] = v
    return out


def write_csv(path: Path, rows: list, fieldnames: list):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main():
    if not IN_PATH.exists():
        raise FileNotFoundError(f"Missing input file: {IN_PATH}")

    with IN_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        raw_rows = list(reader)

    normalized_rows = []
    date_fixed_count = 0
    date_still_invalid_count = 0
    issue_type_fixed_count = 0

    for row in raw_rows:
        out = {k: clean_text(v) for k, v in row.items()}

        # Date normalization
        date_value, date_changed, parse_ok = normalize_date_text(out.get("Date Reviewed", ""))
        if date_changed:
            date_fixed_count += 1
        if not parse_ok:
            date_still_invalid_count += 1
        out["Date Reviewed"] = date_value

        # Issue type normalization
        old_issue = out.get("Issue Type", "")
        new_issue = normalize_issue_type(old_issue)
        if new_issue != old_issue:
            issue_type_fixed_count += 1
        out["Issue Type"] = new_issue

        normalized_rows.append(out)

    # Deduplicate by Trustpilot link when present.
    grouped = defaultdict(list)
    no_link_rows = []
    for row in normalized_rows:
        link = clean_text(row.get("Trustpilot Link", ""))
        if link:
            grouped[link].append(row)
        else:
            no_link_rows.append(row)

    dedup_rows = []
    duplicate_groups = 0
    duplicate_rows_removed = 0

    for link, rows in grouped.items():
        if len(rows) == 1:
            dedup_rows.append(rows[0])
            continue

        duplicate_groups += 1
        duplicate_rows_removed += len(rows) - 1

        best = max(rows, key=row_quality_score)
        merged = dict(best)
        for r in rows:
            if r is best:
                continue
            merged = merge_rows(merged, r)

        dedup_rows.append(merged)

    dedup_rows.extend(no_link_rows)

    # Keep stable ordering by date desc where parseable, otherwise append in existing order.
    def sort_key(row):
        s = clean_text(row.get("Date Reviewed", ""))
        try:
            d = datetime.strptime(s, DATE_FORMAT)
            return (1, d)
        except ValueError:
            return (0, datetime.min)

    dedup_rows.sort(key=sort_key, reverse=True)

    write_csv(NORMALIZED_PATH, normalized_rows, fieldnames)
    write_csv(DEDUP_PATH, dedup_rows, fieldnames)

    # Build report.
    status_before = Counter(clean_text(r.get("Status", "")) for r in raw_rows)
    status_after = Counter(clean_text(r.get("Status", "")) for r in dedup_rows)
    issue_before = Counter(clean_text(r.get("Issue Type", "")) for r in raw_rows)
    issue_after = Counter(clean_text(r.get("Issue Type", "")) for r in dedup_rows)

    report = {
        "input_file": str(IN_PATH),
        "normalized_file": str(NORMALIZED_PATH),
        "dedup_file": str(DEDUP_PATH),
        "input_rows": len(raw_rows),
        "normalized_rows": len(normalized_rows),
        "dedup_rows": len(dedup_rows),
        "date_fixed_count": date_fixed_count,
        "date_still_invalid_count": date_still_invalid_count,
        "issue_type_fixed_count": issue_type_fixed_count,
        "duplicate_trustpilot_link_groups": duplicate_groups,
        "duplicate_rows_removed": duplicate_rows_removed,
        "status_breakdown_before": dict(status_before),
        "status_breakdown_after": dict(status_after),
        "issue_type_breakdown_before": dict(issue_before),
        "issue_type_breakdown_after": dict(issue_after),
    }

    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
