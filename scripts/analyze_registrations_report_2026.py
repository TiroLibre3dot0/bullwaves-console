import csv
import re
import argparse
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


_MMYYYY_RE = re.compile(r"^(\d{1,2})/(\d{4})$")


def _clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _clean_id(value: object) -> str:
    s = _clean(value)
    if not s:
        return ""
    # Remove leading/trailing quotes from malformed CSV values like: "bullwaves-123"""
    return re.sub(r'^"+|"+$', "", s)


def _norm_col(name: object) -> str:
    s = _clean(name).lower()
    # Mirror the dashboard's normalization: spaces -> underscore, drop non-alnum/_
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_]", "", s)
    return s


def _build_norm_to_orig(fieldnames: list[str] | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for f in fieldnames or []:
        nk = _norm_col(f)
        if nk and nk not in out:
            out[nk] = f
    return out


def _pick_col(norm_to_orig: dict[str, str], candidates: list[str]) -> str | None:
    for c in candidates:
        nk = _norm_col(c)
        if nk in norm_to_orig:
            return norm_to_orig[nk]
    return None


def _parse_ts_ms(value: object) -> int | None:
    s = _clean(value)
    if not s:
        return None
    # MM/YYYY or M/YYYY
    m = _MMYYYY_RE.match(s)
    if m:
        mo = int(m.group(1))
        y = int(m.group(2))
        if 1 <= mo <= 12:
            return int(datetime(y, mo, 1, tzinfo=timezone.utc).timestamp() * 1000)

    # M/D/YYYY [HH:mm[:ss]]
    mdy = re.match(
        r"^(\d{1,2})/(\d{1,2})/(\d{4})(?:\s+(\d{1,2})(?::(\d{2}))(?::(\d{2}))?)?$",
        s,
    )
    if mdy:
        mo = int(mdy.group(1))
        d = int(mdy.group(2))
        y = int(mdy.group(3))
        hh = int(mdy.group(4) or 0)
        mm = int(mdy.group(5) or 0)
        ss = int(mdy.group(6) or 0)
        if 1 <= mo <= 12 and 1 <= d <= 31 and 0 <= hh <= 23 and 0 <= mm <= 59 and 0 <= ss <= 59:
            return int(datetime(y, mo, d, hh, mm, ss, tzinfo=timezone.utc).timestamp() * 1000)

    # YYYY-MM or YYYY/MM or YYYY-MM-DD
    ymd = re.match(r"^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$", s)
    if ymd:
        y = int(ymd.group(1))
        mo = int(ymd.group(2))
        d = int(ymd.group(3) or 1)
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return int(datetime(y, mo, d, tzinfo=timezone.utc).timestamp() * 1000)

    return None


def _to_dt(ts_ms: int) -> datetime:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)


def _safe_to_dt(ts_ms: int | None) -> datetime | None:
    if ts_ms is None:
        return None
    try:
        return _to_dt(ts_ms)
    except (OSError, OverflowError, ValueError):
        return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--path",
        default=None,
        help="CSV path to analyze (defaults to Bullwaves_new/public/Registrations Report.csv)",
    )
    args = parser.parse_args()

    public_dir = Path(__file__).resolve().parents[1] / "public"
    path = Path(args.path).expanduser().resolve() if args.path else (public_dir / "Registrations Report.csv")
    now = datetime.now(timezone.utc)

    # Define windows
    y_start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    y_end = datetime(2027, 1, 1, tzinfo=timezone.utc)
    m_start = datetime(2026, 3, 1, tzinfo=timezone.utc)
    m_end = datetime(2026, 4, 1, tzinfo=timezone.utc)

    total_rows = 0
    max_ts_ms: int | None = None
    max_ts_row: dict[str, str] | None = None

    # Diagnostics / counts
    missing_user_id_rows = 0
    missing_mt5_rows = 0
    user_id_counts_2026 = Counter()
    invalid_ts_rows = 0

    rows_2026 = 0
    rows_march = 0
    users_2026_ytd: set[str] = set()
    users_march: set[str] = set()
    mt5_2026_ytd: set[str] = set()
    mt5_march: set[str] = set()

    # Daily-unique diagnostics (month only)
    march_day_users_fallback: dict[str, set[str]] = {}
    march_day_users_by_reg: dict[str, set[str]] = {}
    march_day_users_by_ext: dict[str, set[str]] = {}

    # Alternate definitions (use a single field)
    rows_2026_by_reg = 0
    rows_2026_by_ext = 0
    rows_march_by_reg = 0
    rows_march_by_ext = 0
    users_2026_by_reg: set[str] = set()
    users_2026_by_ext: set[str] = set()
    users_march_by_reg: set[str] = set()
    users_march_by_ext: set[str] = set()

    status_rows_2026 = Counter()
    status_users_2026: dict[str, set[str]] = {}

    with path.open("r", newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)

        norm_to_orig = _build_norm_to_orig(reader.fieldnames)
        user_id_col = _pick_col(norm_to_orig, ["user_id", "user id", "userid"]) 
        mt5_col = _pick_col(norm_to_orig, ["mt5_account", "mt5 account", "mt5account"]) 
        status_col = _pick_col(norm_to_orig, ["status"]) 
        reg_col = _pick_col(
            norm_to_orig,
            ["registration_date", "registration date", "registrationdate", "reg_date", "reg date"],
        )
        ext_col = _pick_col(
            norm_to_orig,
            ["external_date", "external date", "externaldate"],
        )

        # Per-row date fallback (match dashboard intent: prefer registration_date when present)
        fallback_date_cols = [
            c
            for c in [
                reg_col,
                ext_col,
                _pick_col(norm_to_orig, ["created_at", "created at", "createdat"]),
                _pick_col(norm_to_orig, ["date"]),
            ]
            if c
        ]

        for row in reader:
            total_rows += 1

            user_id = _clean_id(row.get(user_id_col)) if user_id_col else ""
            mt5 = _clean_id(row.get(mt5_col)) if mt5_col else ""

            if not user_id:
                missing_user_id_rows += 1
            if not mt5:
                missing_mt5_rows += 1

            ts_ms: int | None = None
            for col in fallback_date_cols:
                ts_ms = _parse_ts_ms(row.get(col))
                if ts_ms is not None:
                    break
            if ts_ms is None:
                continue

            if max_ts_ms is None or ts_ms > max_ts_ms:
                max_ts_ms = ts_ms
                max_ts_row = row

            dt = _safe_to_dt(ts_ms)
            if dt is None:
                invalid_ts_rows += 1
                continue
            if dt < y_start or dt >= y_end:
                continue

            rows_2026 += 1
            if user_id:
                users_2026_ytd.add(user_id)
                user_id_counts_2026[user_id] += 1
            if mt5:
                mt5_2026_ytd.add(mt5)

            status = _clean(row.get(status_col) if status_col else "").strip() or "(empty)"
            status_rows_2026[status] += 1
            if user_id:
                status_users_2026.setdefault(status, set()).add(user_id)

            if m_start <= dt < m_end:
                rows_march += 1
                if user_id:
                    users_march.add(user_id)
                    march_day_users_fallback.setdefault(dt.date().isoformat(), set()).add(user_id)
                if mt5:
                    mt5_march.add(mt5)

            # Single-field comparisons
            reg_ts = _parse_ts_ms(row.get(reg_col)) if reg_col else None
            ext_ts = _parse_ts_ms(row.get(ext_col)) if ext_col else None
            if reg_ts is not None:
                reg_dt = _safe_to_dt(reg_ts)
                if reg_dt is None:
                    invalid_ts_rows += 1
                    reg_dt = None
                if reg_dt is not None and y_start <= reg_dt < y_end:
                    rows_2026_by_reg += 1
                    if user_id:
                        users_2026_by_reg.add(user_id)
                    if m_start <= reg_dt < m_end:
                        rows_march_by_reg += 1
                        if user_id:
                            users_march_by_reg.add(user_id)
                            march_day_users_by_reg.setdefault(reg_dt.date().isoformat(), set()).add(user_id)
            if ext_ts is not None:
                ext_dt = _safe_to_dt(ext_ts)
                if ext_dt is None:
                    invalid_ts_rows += 1
                    ext_dt = None
                if ext_dt is not None and y_start <= ext_dt < y_end:
                    rows_2026_by_ext += 1
                    if user_id:
                        users_2026_by_ext.add(user_id)
                    if m_start <= ext_dt < m_end:
                        rows_march_by_ext += 1
                        if user_id:
                            users_march_by_ext.add(user_id)
                            march_day_users_by_ext.setdefault(ext_dt.date().isoformat(), set()).add(user_id)

    dup_users_2026 = sum(1 for _u, c in user_id_counts_2026.items() if c > 1)
    extra_rows_due_to_dups_2026 = sum(c - 1 for c in user_id_counts_2026.values() if c > 1)

    status_unique_users_2026 = {k: len(v) for k, v in status_users_2026.items()}

    sum_march_daily_unique_fallback = sum(len(s) for s in march_day_users_fallback.values())
    sum_march_daily_unique_by_reg = sum(len(s) for s in march_day_users_by_reg.values())
    sum_march_daily_unique_by_ext = sum(len(s) for s in march_day_users_by_ext.values())

    print(
        {
            "now_utc": now.isoformat(),
            "source_path": str(path),
            "csv_total_rows": total_rows,
            "max_registration_ts_utc": _to_dt(max_ts_ms).isoformat() if max_ts_ms is not None else None,
            "max_ts_user_id": _clean_id((max_ts_row or {}).get("user_id")) if max_ts_row else None,
            "window": {
                "2026_ytd_start": y_start.isoformat(),
                "2026_end_exclusive": y_end.isoformat(),
                "march_2026_start": m_start.isoformat(),
                "april_2026_start": m_end.isoformat(),
            },
            "2026": {
                "rows": rows_2026,
                "unique_user_id": len(users_2026_ytd),
                "unique_mt5_account": len(mt5_2026_ytd),
                "duplicate_user_ids": dup_users_2026,
                "extra_rows_from_duplicate_user_ids": extra_rows_due_to_dups_2026,
            },
            "march_2026": {
                "rows": rows_march,
                "unique_user_id": len(users_march),
                "unique_mt5_account": len(mt5_march),
                "sum_daily_unique_user_id": sum_march_daily_unique_fallback,
                "days_with_data": len(march_day_users_fallback),
            },
            "compare_single_date_fields": {
                "2026": {
                    "rows_by_registration_date": rows_2026_by_reg,
                    "unique_users_by_registration_date": len(users_2026_by_reg),
                    "rows_by_external_date": rows_2026_by_ext,
                    "unique_users_by_external_date": len(users_2026_by_ext),
                },
                "march_2026": {
                    "rows_by_registration_date": rows_march_by_reg,
                    "unique_users_by_registration_date": len(users_march_by_reg),
                    "sum_daily_unique_users_by_registration_date": sum_march_daily_unique_by_reg,
                    "rows_by_external_date": rows_march_by_ext,
                    "unique_users_by_external_date": len(users_march_by_ext),
                    "sum_daily_unique_users_by_external_date": sum_march_daily_unique_by_ext,
                },
            },
            "status_breakdown_2026_ytd": {
                "rows": dict(status_rows_2026),
                "unique_users": status_unique_users_2026,
            },
            "missing_fields_rows": {
                "missing_user_id_rows": missing_user_id_rows,
                "missing_mt5_account_rows": missing_mt5_rows,
                "invalid_timestamp_rows": invalid_ts_rows,
            },
        }
    )


if __name__ == "__main__":
    main()
