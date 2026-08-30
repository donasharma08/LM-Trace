"""
Draws a box on the original image for each declaration the rule
engine matched, so the officer sees exactly which pixels produced
which finding instead of trusting a text-only claim.
"""

from __future__ import annotations

import cv2
import numpy as np

BOX_COLOR_BGR = (79, 42, 27)   # ink navy, matches the frontend's --color-ink
BOX_THICKNESS = 3


def draw_evidence_boxes(image_bgr: np.ndarray, field_regions: list[dict]) -> np.ndarray:
    annotated = image_bgr.copy()
    for region in field_regions:
        bbox = region.get("bbox_px")
        if not bbox:
            continue
        pts = np.array(bbox, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(annotated, [pts], isClosed=True, color=BOX_COLOR_BGR, thickness=BOX_THICKNESS)
        label = region["field_id"]
        origin = tuple(np.array(bbox[0], dtype=np.int32))
        cv2.putText(
            annotated, label, (origin[0], max(origin[1] - 8, 12)),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, BOX_COLOR_BGR, 1, cv2.LINE_AA,
        )
    return annotated


def encode_jpeg(image_bgr: np.ndarray) -> bytes:
    success, buf = cv2.imencode(".jpg", image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not success:
        raise RuntimeError("Failed to encode annotated evidence image")
    return buf.tobytes()
