from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.database import get_supabase
from app.models import CompanyOut, DashboardStatsOut, ProductSummaryOut
from app.routers.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductSummaryOut])
async def list_products(
    search: str | None = Query(None),
    status: str | None = Query(None, pattern="^(pass|potential_non_compliance|review_required|all)?$"),
    user: CurrentUser = Depends(get_current_user),
):
    supabase = get_supabase()
    query = supabase.table("scans").select("*").order("created_at", desc=True)
    if search:
        query = query.ilike("product_name", f"%{search}%")
    rows = query.execute().data or []

    by_product: dict[str, dict] = {}
    for row in rows:
        name = row["product_name"]
        entry = by_product.setdefault(
            name,
            {
                "id": name,
                "name": name,
                "last_scan_id": row["id"],
                "last_scan_status": row["overall_status"],
                "last_scanned_at": row["created_at"],
                "total_scans": 0,
            },
        )
        entry["total_scans"] += 1

    results = list(by_product.values())
    if status and status != "all":
        results = [r for r in results if r["last_scan_status"] == status]

    return results


@router.get("/dashboard/stats", response_model=DashboardStatsOut)
async def dashboard_stats(user: CurrentUser = Depends(get_current_user)):
    supabase = get_supabase()
    rows = supabase.table("scans").select("product_name, overall_status").execute().data or []
    products = {r["product_name"] for r in rows}

    companies = supabase.table("companies").select("non_compliant_count").execute().data or []
    repeat_offenders = sum(1 for c in companies if c.get("non_compliant_count", 0) > 1)

    return DashboardStatsOut(
        total_products=len(products),
        total_scans=len(rows),
        pass_count=sum(1 for r in rows if r["overall_status"] == "pass"),
        potential_non_compliance_count=sum(1 for r in rows if r["overall_status"] == "potential_non_compliance"),
        review_required_count=sum(1 for r in rows if r["overall_status"] == "review_required"),
        repeat_offender_companies=repeat_offenders,
    )


@router.get("/companies/repeat-offenders", response_model=list[CompanyOut])
async def repeat_offenders(user: CurrentUser = Depends(get_current_user)):
    supabase = get_supabase()
    rows = (
        supabase.table("companies")
        .select("*")
        .gt("non_compliant_count", 1)
        .order("non_compliant_count", desc=True)
        .execute()
        .data
        or []
    )
    return rows


@router.get("/{scan_id}")
async def get_scan_detail(scan_id: str, user: CurrentUser = Depends(get_current_user)):
    supabase = get_supabase()
    row = supabase.table("scans").select("*").eq("id", scan_id).single().execute().data
    company = None
    if row and row.get("company_id"):
        company = supabase.table("companies").select("*").eq("id", row["company_id"]).single().execute().data
    return {**row, "company": company}
