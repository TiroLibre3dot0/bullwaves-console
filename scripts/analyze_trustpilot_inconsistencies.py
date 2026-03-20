from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parents[1]
INPUT_CSV = ROOT / "Trustpilot" / "TrustPilot Review Tracker.csv"
OUT_JSON = ROOT / "artifacts" / "raw" / "trustpilot_line_issues.json"
OUT_MD = ROOT / "Trustpilot" / "trustpilot_incongruence_report.md"


REQUIRED_COLUMNS = [
    "Date Reviewed",
    "Reviewer Name",
    "Issue Type",
    "Trustpilot Link",
    "Status",
]

ALLOWED_ISSUE_TYPES = {"Support", "Withdrawal", "Trading", "Other", "Registration"}
ISSUE_TYPE_TYPOS = {"Supprot": "Support", "Others": "Other"}

MONTH_TYPOS = {
    "Septemer": "September",
    "Spetember": "September",
    "Setpember": "September",
    "Janaury": "January",
    "Februrary": "February",
    "Auguest": "August",
    "Ocotber": "October",
    "Novemeber": "November",
    "Decemeber": "December",
}

DATE_FORMATS = [
    "%b %d, %Y",
    "%B %d, %Y",
    "%b %d,%Y",
    "%B %d,%Y",
    "%b %d,%y",
    "%B %d,%y",
    "%Y-%m-%d",
]


@dataclass
class RowWithLine:
    line: int
    row: Dict[str, str]


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def fix_month_typos(value: str) -> str:
    text = value
    for bad, good in MONTH_TYPOS.items():
        text = re.sub(rf"(?i)\b{re.escape(bad)}\b", good, text)
    return text


def parse_date_to_iso(value: str) -> str | None:
    text = normalize_spaces(value)
    if not text:
        return None
    text = fix_month_typos(text)
    text = re.sub(r",\s*", ", ", text)
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def normalize_trustpilot_link(link: str) -> str:
    value = (link or "").strip()
    if not value:
        return ""
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", value):
        value = f"https://{value}"
    try:
        parts = urlsplit(value)
        scheme = (parts.scheme or "https").lower()
        netloc = parts.netloc.lower()
        path = re.sub(r"/+", "/", parts.path or "/").rstrip("/") or "/"
        query_items = parse_qsl(parts.query, keep_blank_values=True)
        query = urlencode(sorted(query_items)) if query_items else ""
        return urlunsplit((scheme, netloc, path, query, ""))
    except Exception:
        return value.lower().rstrip("/")


def load_rows() -> List[RowWithLine]:
    rows: List[RowWithLine] = []
    with INPUT_CSV.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for line_num, row in enumerate(reader, start=2):
            rows.append(RowWithLine(line=line_num, row=row))
    return rows


def to_ranges(numbers: List[int]) -> List[tuple[int, int]]:
    if not numbers:
        return []
    ranges: List[tuple[int, int]] = []
    start = end = numbers[0]
    for n in numbers[1:]:
        if n == end + 1:
            end = n
        else:
            ranges.append((start, end))
            start = end = n
    ranges.append((start, end))
    return ranges


def csv_line_link(line: int) -> str:
    target = "Bullwaves_new/Trustpilot/TrustPilot%20Review%20Tracker.csv"
    return f"[{target}#L{line}]({target}#L{line})"


def csv_range_link(start: int, end: int) -> str:
    target = "Bullwaves_new/Trustpilot/TrustPilot%20Review%20Tracker.csv"
    return f"[{target}#L{start}-L{end}]({target}#L{start}-L{end})"


def write_markdown_report(result: Dict[str, object]) -> None:
    blank_required = result["blank_required"]
    status_lines = sorted({x["line"] for x in blank_required if x["column"] == "Status"})
    blank_link_lines = sorted(
        {x["line"] for x in blank_required if x["column"] == "Trustpilot Link"}
    )

    lines: List[str] = []
    lines.append("# Report Incongruenze CSV Trustpilot")
    lines.append("")
    lines.append(
        "Fonte analisi: [Bullwaves_new/artifacts/raw/trustpilot_line_issues.json](Bullwaves_new/artifacts/raw/trustpilot_line_issues.json)"
    )
    lines.append(
        "File analizzato: [Bullwaves_new/Trustpilot/TrustPilot Review Tracker.csv](Bullwaves_new/Trustpilot/TrustPilot%20Review%20Tracker.csv)"
    )
    lines.append("")
    lines.append("## Prioritarie da correggere o rivedere")
    lines.append("")

    duplicate_groups = result["duplicate_link_groups"]
    lines.append(
        f"1. Duplicati su Trustpilot Link: {result['duplicate_link_groups_count']} gruppi, {result['duplicate_link_rows_total']} righe coinvolte"
    )
    for group in duplicate_groups:
        a, b = group["lines"]
        lines.append(
            f"- {group['normalized_link']} -> {csv_line_link(a)} e {csv_line_link(b)}"
        )
    lines.append("")

    invalid_links = result["invalid_link"]
    lines.append(
        f"2. Link non di recensione (puntano a profili /users): {result['invalid_link_count']} righe"
    )
    for row in invalid_links:
        lines.append(f"- {csv_line_link(row['line'])} -> {row['value']}")
    lines.append("")

    issue_type_typos = result["issue_type_typos"]
    lines.append(
        f"3. Valori Issue Type non conformi: {result['issue_type_typos_count']} righe"
    )
    for row in issue_type_typos:
        lines.append(
            f"- {csv_line_link(row['line'])} -> '{row['value']}' (suggerito: '{row['suggested']}')"
        )
    lines.append("")

    lines.append(f"4. Riga con Trustpilot Link mancante: {len(blank_link_lines)}")
    for line_num in blank_link_lines:
        lines.append(f"- {csv_line_link(line_num)}")
    lines.append("")

    lines.append("## Non prioritarie (ma da standardizzare)")
    lines.append("")
    lines.append(f"1. Status vuoto: {len(status_lines)} righe")
    for start, end in to_ranges(status_lines):
        lines.append(f"- {csv_range_link(start, end)}")
    lines.append("")

    artifact_fields = result["artifact_fields"]
    lines.append(
        f"2. Campi con caratteri quote/apice borderline: {result['artifact_field_count']} casi"
    )
    for row in artifact_fields:
        lines.append(
            f"- {csv_line_link(row['line'])} -> colonna {row['column']} valore {row['value']}"
        )
    lines.append("")

    lines.append("## Note positive")
    lines.append("")
    lines.append(
        f"- Date non parseabili: {result['invalid_date_count']} (nessuna anomalia residua)"
    )
    lines.append("")

    lines.append("## Indicazioni pratiche di correzione")
    lines.append("")
    lines.append(
        "- Impostare una chiave tecnica di dedup basata su Trustpilot Link normalizzato (host lowercase, slash finale rimosso, query ordinata)."
    )
    lines.append(
        "- Per ogni gruppo duplicato, mantenere una sola riga: preferire quella con campi piu completi (Status valorizzato, Assigned To valorizzato, Date Reviewed valida)."
    )
    lines.append(
        "- Standardizzare Issue Type con elenco chiuso: Support, Withdrawal, Trading, Other, Registration."
    )
    lines.append(
        "- Separare il concetto di URL recensione e URL profilo: i link /users vanno in una colonna dedicata Reviewer Profile URL, non in Trustpilot Link."
    )
    lines.append(
        "- Definire regola operativa per Status vuoto: se ammesso, usare valore esplicito Pending; se non ammesso, bloccare salvataggio/export."
    )

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    rows = load_rows()

    blank_required: List[Dict[str, object]] = []
    invalid_date: List[Dict[str, object]] = []
    issue_type_typos: List[Dict[str, object]] = []
    invalid_link: List[Dict[str, object]] = []
    artifact_fields: List[Dict[str, object]] = []

    for item in rows:
        line = item.line
        row = item.row

        for col in REQUIRED_COLUMNS:
            if not (row.get(col) or "").strip():
                blank_required.append({"line": line, "column": col})

        date_value = row.get("Date Reviewed", "")
        if date_value.strip() and parse_date_to_iso(date_value) is None:
            invalid_date.append({"line": line, "value": date_value})

        issue_type = (row.get("Issue Type") or "").strip()
        if issue_type in ISSUE_TYPE_TYPOS:
            issue_type_typos.append(
                {
                    "line": line,
                    "value": issue_type,
                    "suggested": ISSUE_TYPE_TYPOS[issue_type],
                }
            )
        elif issue_type and issue_type not in ALLOWED_ISSUE_TYPES:
            issue_type_typos.append(
                {"line": line, "value": issue_type, "suggested": "Review manually"}
            )

        link = (row.get("Trustpilot Link") or "").strip()
        if link and not re.search(r"trustpilot\.com/reviews/", link, re.IGNORECASE):
            invalid_link.append(
                {
                    "line": line,
                    "value": link,
                    "reason": "not Trustpilot review URL pattern",
                }
            )

        for key in [
            "Reviewer Name",
            "Potential Lead",
            "Assigned To",
            "Category",
            "Issue Type",
            "Status",
        ]:
            value = (row.get(key) or "")
            if re.search(r"(^[\"',]+)|([\"',]+$)", value.strip()):
                artifact_fields.append({"line": line, "column": key, "value": value})

    link_groups: Dict[str, List[int]] = defaultdict(list)
    for item in rows:
        link = (item.row.get("Trustpilot Link") or "").strip()
        if not link:
            continue
        normalized = normalize_trustpilot_link(link)
        if normalized:
            link_groups[normalized].append(item.line)

    duplicate_link_groups: List[Dict[str, object]] = []
    for normalized_link, lines in sorted(
        link_groups.items(), key=lambda kv: (-len(kv[1]), kv[0])
    ):
        if len(lines) > 1:
            duplicate_link_groups.append(
                {
                    "normalized_link": normalized_link,
                    "count": len(lines),
                    "lines": lines,
                }
            )

    result = {
        "file": str(INPUT_CSV),
        "total_rows": len(rows),
        "blank_required_count": len(blank_required),
        "blank_required": blank_required,
        "invalid_date_count": len(invalid_date),
        "invalid_date": invalid_date,
        "issue_type_typos_count": len(issue_type_typos),
        "issue_type_typos": issue_type_typos,
        "invalid_link_count": len(invalid_link),
        "invalid_link": invalid_link,
        "duplicate_link_groups_count": len(duplicate_link_groups),
        "duplicate_link_groups": duplicate_link_groups,
        "duplicate_link_rows_total": sum(g["count"] for g in duplicate_link_groups),
        "artifact_field_count": len(artifact_fields),
        "artifact_fields": artifact_fields,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown_report(result)
    print(str(OUT_JSON))
    print(str(OUT_MD))


if __name__ == "__main__":
    main()