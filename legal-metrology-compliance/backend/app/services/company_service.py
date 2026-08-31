"""
Groups scans by the manufacturer/packer/importer named on the label,
so repeat non-compliance from the same company is visible instead of
buried as isolated per-product scans.

Matching is intentionally simple for the MVP: normalize (lowercase,
strip punctuation/whitespace/common suffixes like "pvt ltd") and use
that as the lookup key. This will merge true duplicates but can also
under- or over-merge on inconsistently printed names -- flagged here,
not hidden, since it directly affects how much you can trust the
"failed N times" count on the report.
"""

from __future__ import annotations

import re


def normalize_company_name(raw_name: str) -> str:
    name = raw_name.lower()
    name = re.sub(r"\b(pvt\.?|private|ltd\.?|limited|inc\.?|llp|co\.?)\b", "", name)
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def get_or_create_company(supabase, raw_name: str) -> dict:
    normalized = normalize_company_name(raw_name)
    if not normalized:
        return None

    existing = (
        supabase.table("companies")
        .select("*")
        .eq("name_normalized", normalized)
        .execute()
        .data
    )
    if existing:
        return existing[0]

    created = (
        supabase.table("companies")
        .insert({"name_raw": raw_name.strip(), "name_normalized": normalized})
        .execute()
        .data
    )
    return created[0] if created else None


def record_scan_outcome(supabase, company_id: str, is_non_compliant: bool) -> None:
    if not company_id:
        return
    company = supabase.table("companies").select("*").eq("id", company_id).single().execute().data
    if not company:
        return
    updates = {"total_scans": company.get("total_scans", 0) + 1}
    if is_non_compliant:
        updates["non_compliant_count"] = company.get("non_compliant_count", 0) + 1
    supabase.table("companies").update(updates).eq("id", company_id).execute()
