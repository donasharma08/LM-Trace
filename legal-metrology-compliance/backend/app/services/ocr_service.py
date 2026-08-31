"""
OCR extraction via OCR.space's cloud API instead of a local model.

Why the swap: EasyOCR pulls in PyTorch, needs a multi-hundred-MB model
downloaded on first use, and needs more RAM than Render's lower tiers
comfortably give it -- exactly the failure mode hit earlier (backend
"crash" that was actually a slow/OOM model download). A cloud OCR call
has none of that: no local model, no native ML dependency, works the
same whether the caller is a Windows laptop or a Linux container.

Trade-off, stated plainly: an external network dependency and the free
tier's rate limit (OCR.space's default demo key is shared and capped;
get your own free key at ocr.space/ocrapi and set OCR_SPACE_API_KEY).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import requests
from fastapi import HTTPException

from app.config import get_settings

OCR_SPACE_URL = "https://api.ocr.space/parse/image"


@dataclass
class TextRegion:
    text: str
    confidence: float
    bbox_px: list  # [[x,y]] x4 quadrilateral, in reading order
    bbox_height_px: float
    source_panel: str = "primary"


@dataclass
class OcrResult:
    full_text: str
    regions: list[TextRegion]


def extract(image_bgr: np.ndarray, source_panel: str = "primary") -> OcrResult:
    import cv2

    success, buf = cv2.imencode(".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode image for OCR")

    settings = get_settings()
    api_key = settings.OCR_SPACE_API_KEY or "helloworld"  # shared demo key, low rate limit -- get your own

    try:
        response = requests.post(
            OCR_SPACE_URL,
            files={"file": ("image.jpg", buf.tobytes(), "image/jpeg")},
            data={"apikey": api_key, "isOverlayRequired": "true", "OCREngine": "2"},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"OCR service unreachable: {exc}") from exc

    if payload.get("IsErroredOnProcessing"):
        raise HTTPException(
            status_code=502, detail=f"OCR service error: {payload.get('ErrorMessage')}"
        )

    parsed = (payload.get("ParsedResults") or [{}])[0]
    full_text = parsed.get("ParsedText", "")

    regions: list[TextRegion] = []
    overlay = parsed.get("TextOverlay") or {}
    for line in overlay.get("Lines", []):
        for word in line.get("Words", []):
            x, y = word["Left"], word["Top"]
            w, h = word["Width"], word["Height"]
            regions.append(
                TextRegion(
                    text=word["WordText"],
                    confidence=1.0,  # OCR.space's free tier doesn't return per-word confidence
                    bbox_px=[[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
                    bbox_height_px=float(h),
                    source_panel=source_panel,
                )
            )

    return OcrResult(full_text=full_text, regions=regions)


def merge_results(results: list[OcrResult]) -> OcrResult:
    all_regions: list[TextRegion] = []
    all_text: list[str] = []
    for r in results:
        all_regions.extend(r.regions)
        all_text.append(r.full_text)
    return OcrResult(full_text="\n".join(all_text), regions=all_regions)


def map_regions_to_fields(ocr_result: OcrResult, declaration_matches: dict) -> list[dict]:
    """
    Best-effort mapping from a matched declaration's text snippet back
    to the OCR word region(s) that produced it, for font-size
    measurement and the interactive evidence overlay. Word-level boxes
    from OCR.space mean a multi-word declaration (e.g. an address) only
    maps to its first matching word, not the full span -- acceptable
    for MVP, noted here rather than silently assumed complete.
    """
    field_regions = []
    for field_id, matched_text in declaration_matches.items():
        if not matched_text:
            continue
        first_word = matched_text.strip().split()[0].lower() if matched_text.strip() else ""
        for region in ocr_result.regions:
            if first_word and first_word in region.text.lower():
                field_regions.append(
                    {
                        "field_id": field_id,
                        "text": region.text,
                        "bbox_height_px": region.bbox_height_px,
                        "bbox_px": region.bbox_px,
                        "source_panel": region.source_panel,
                    }
                )
                break
    return field_regions
