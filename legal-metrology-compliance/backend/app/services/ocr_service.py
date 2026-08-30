"""
OCR extraction service. Wraps EasyOCR (offline, free) as the default
engine -- swap the implementation behind extract() for a cloud engine
later without touching callers.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import easyocr
import numpy as np


@dataclass
class TextRegion:
    text: str
    confidence: float
    bbox_px: list  # [[x,y], [x,y], [x,y], [x,y]] quadrilateral, in reading order
    bbox_height_px: float
    source_panel: str = "primary"  # "primary" or "secondary" (front/back)


@dataclass
class OcrResult:
    full_text: str
    regions: list[TextRegion]


@lru_cache(maxsize=1)
def _get_reader() -> easyocr.Reader:
    return easyocr.Reader(["en"], gpu=False)


def extract(image_bgr: np.ndarray, source_panel: str = "primary") -> OcrResult:
    reader = _get_reader()
    raw_results = reader.readtext(image_bgr)

    regions: list[TextRegion] = []
    lines: list[str] = []
    for bbox, text, confidence in raw_results:
        ys = [pt[1] for pt in bbox]
        height_px = max(ys) - min(ys)
        regions.append(
            TextRegion(
                text=text,
                confidence=float(confidence),
                bbox_px=bbox,
                bbox_height_px=float(height_px),
                source_panel=source_panel,
            )
        )
        lines.append(text)

    return OcrResult(full_text="\n".join(lines), regions=regions)


def merge_results(results: list[OcrResult]) -> OcrResult:
    """Combine OCR output from multiple photographed panels (e.g. front
    + back) into one result for the rule engine to evaluate together."""
    all_regions: list[TextRegion] = []
    all_text: list[str] = []
    for r in results:
        all_regions.extend(r.regions)
        all_text.append(r.full_text)
    return OcrResult(full_text="\n".join(all_text), regions=all_regions)


def map_regions_to_fields(ocr_result: OcrResult, declaration_matches: dict) -> list[dict]:
    """
    Best-effort mapping from a matched declaration's text snippet back
    to the OCR region(s) that produced it, for font-size measurement
    and for drawing the evidence bounding box in the UI. Matching is by
    substring containment -- fine for single-line declarations, not
    guaranteed for text OCR split across multiple regions.
    """
    field_regions = []
    for field_id, matched_text in declaration_matches.items():
        if not matched_text:
            continue
        for region in ocr_result.regions:
            if matched_text.strip()[:20].lower() in region.text.lower() or region.text.lower() in matched_text.lower():
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
