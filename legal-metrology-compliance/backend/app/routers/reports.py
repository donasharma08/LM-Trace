from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.database import get_supabase
from app.routers.auth import CurrentUser, get_current_user
from app.services import report_service
from app.services.rule_engine import ComplianceResult, DeclarationResult

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _load_result(scan_id: str) -> tuple[str, ComplianceResult, str | None]:
    supabase = get_supabase()
    row = supabase.table("scans").select("*").eq("id", scan_id).single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")

    declarations = [DeclarationResult(**d) for d in row["declarations"]]
    result = ComplianceResult(
        overall_status=row["overall_status"],
        declarations=declarations,
        structural_flags=row["structural_flags"] or [],
        calibrated=row["calibrated"],
    )

    company_note = None
    if row.get("company_id"):
        company = supabase.table("companies").select("*").eq("id", row["company_id"]).single().execute().data
        if company and company.get("non_compliant_count", 0) > 1:
            company_note = (
                f'{company["name_raw"]} has {company["non_compliant_count"]} non-compliant scans '
                f'on record across {company["total_scans"]} total inspections.'
            )

    return row["product_name"], result, company_note


@router.get("/{scan_id}/pdf")
async def get_pdf_report(scan_id: str, user: CurrentUser = Depends(get_current_user)):
    product_name, result, company_note = _load_result(scan_id)
    pdf_bytes = report_service.generate_pdf(product_name, scan_id, result, company_note)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{scan_id}-compliance-report.pdf"'},
    )


@router.get("/{scan_id}/docx")
async def get_docx_report(scan_id: str, user: CurrentUser = Depends(get_current_user)):
    product_name, result, company_note = _load_result(scan_id)
    docx_bytes = report_service.generate_docx(product_name, scan_id, result, company_note)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{scan_id}-compliance-report.docx"'},
    )
