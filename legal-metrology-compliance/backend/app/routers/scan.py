from __future__ import annotations

import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.database import get_supabase
from app.models import ScanResultOut
from app.routers.auth import CurrentUser, get_current_user
from app.services import barcode_service, company_service, evidence_service, ocr_service, quality_service
from app.services.rule_engine import RuleEngine

router = APIRouter(prefix="/api/scan", tags=["scan"])
rule_engine = RuleEngine()


def _read_image(upload: UploadFile) -> np.ndarray:
    data = upload.file.read()
    arr = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image -- upload a JPG or PNG")
    return image


@router.post("", response_model=ScanResultOut)
async def create_scan(
    product_name: str = Form(...),
    is_imported: bool = Form(False),
    re_scan_of: str | None = Form(None),
    image: UploadFile = File(...),
    back_panel_image: UploadFile | None = File(None),
    evidence_photos: list[UploadFile] = File(default=[]),
    user: CurrentUser = Depends(get_current_user),
):
    primary_img = _read_image(image)

    quality = quality_service.check(primary_img)
    if not quality.acceptable:
        raise HTTPException(
            status_code=422,
            detail={"message": "Image quality too low to scan reliably", "issues": quality.issues},
        )

    panels_photographed = 1
    images_for_ocr = [(primary_img, "primary")]
    if back_panel_image is not None:
        back_img = _read_image(back_panel_image)
        back_quality = quality_service.check(back_img)
        if back_quality.acceptable:
            images_for_ocr.append((back_img, "secondary"))
            panels_photographed = 2

    ocr_results = [ocr_service.extract(img, source_panel=panel) for img, panel in images_for_ocr]
    merged_ocr = ocr_service.merge_results(ocr_results)

    calibration = barcode_service.calibrate(primary_img)

    prelim = rule_engine.evaluate(
        merged_ocr.full_text, is_imported=is_imported, panels_photographed=panels_photographed
    )
    declaration_matches = {d.id: d.matched_text for d in prelim.declarations}
    field_regions = ocr_service.map_regions_to_fields(merged_ocr, declaration_matches)

    result = rule_engine.evaluate(
        extracted_text=merged_ocr.full_text,
        text_regions=field_regions,
        is_imported=is_imported,
        mm_per_pixel=calibration.mm_per_pixel,
        panels_photographed=panels_photographed,
    )

    annotated = evidence_service.draw_evidence_boxes(primary_img, field_regions)
    annotated_bytes = evidence_service.encode_jpeg(annotated)

    scan_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)

    supabase = get_supabase()

    company = None
    manufacturer_result = next((d for d in result.declarations if d.id == "manufacturer_details"), None)
    if manufacturer_result and manufacturer_result.matched_text:
        company = company_service.get_or_create_company(supabase, manufacturer_result.matched_text)
        if company:
            company_service.record_scan_outcome(
                supabase, company["id"], is_non_compliant=(result.overall_status != "pass")
            )

    evidence_urls = _upload_evidence(
        supabase, scan_id, [image] + list(evidence_photos), annotated_bytes
    )
    primary_image_url = evidence_urls[0] if evidence_urls else None
    img_height, img_width = primary_img.shape[:2]

    supabase.table("scans").insert(
        {
            "id": scan_id,
            "product_name": product_name,
            "officer_id": user.user_id,
            "overall_status": result.overall_status,
            "calibrated": result.calibrated,
            "declarations": [d.__dict__ for d in result.declarations],
            "structural_flags": result.structural_flags,
            "evidence_urls": evidence_urls,
            "company_id": company["id"] if company else None,
            "re_scan_of": re_scan_of,
            "panels_photographed": panels_photographed,
            "image_width": img_width,
            "image_height": img_height,
            "created_at": created_at.isoformat(),
        }
    ).execute()

    company_note = None
    if company and company.get("non_compliant_count", 0) > 1:
        company_note = (
            f'{company["name_raw"]} has {company["non_compliant_count"]} non-compliant scans '
            f'on record across {company["total_scans"]} total inspections.'
        )

    return ScanResultOut(
        scan_id=scan_id,
        product_name=product_name,
        overall_status=result.overall_status,
        calibrated=result.calibrated,
        declarations=result.declarations,
        structural_flags=result.structural_flags,
        company_note=company_note,
        primary_image_url=primary_image_url,
        image_width=img_width,
        image_height=img_height,
        created_at=created_at,
    )


def _upload_evidence(supabase, scan_id: str, files: list[UploadFile], annotated_bytes: bytes) -> list[str]:
    urls = []
    for i, f in enumerate(files):
        f.file.seek(0)
        content = f.file.read()
        path = f"{scan_id}/{i}_{f.filename}"
        supabase.storage.from_("evidence-photos").upload(path, content)
        urls.append(supabase.storage.from_("evidence-photos").get_public_url(path))

    annotated_path = f"{scan_id}/annotated_evidence.jpg"
    supabase.storage.from_("evidence-photos").upload(annotated_path, annotated_bytes)
    urls.append(supabase.storage.from_("evidence-photos").get_public_url(annotated_path))
    return urls
