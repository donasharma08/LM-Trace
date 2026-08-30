"""
Image quality gate. Runs before OCR. Rejects unusable photos early
instead of letting a bad image silently produce bad results.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

BLUR_VARIANCE_THRESHOLD = 80.0       # below this, image is likely too blurry (Laplacian variance)
OVEREXPOSED_FRACTION_THRESHOLD = 0.35  # fraction of pixels near-white -> likely glare
UNDEREXPOSED_MEAN_THRESHOLD = 40.0    # mean brightness below this -> likely too dark


@dataclass
class QualityResult:
    acceptable: bool
    issues: list[str]
    blur_variance: float
    mean_brightness: float


def check(image_bgr: np.ndarray) -> QualityResult:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    mean_brightness = float(gray.mean())
    overexposed_fraction = float(np.mean(gray > 245))

    issues = []
    if blur_variance < BLUR_VARIANCE_THRESHOLD:
        issues.append("Image appears blurry -- hold the camera steady and retake.")
    if overexposed_fraction > OVEREXPOSED_FRACTION_THRESHOLD:
        issues.append("Image appears washed out by glare -- adjust angle or lighting and retake.")
    if mean_brightness < UNDEREXPOSED_MEAN_THRESHOLD:
        issues.append("Image appears too dark -- improve lighting and retake.")

    return QualityResult(
        acceptable=not issues,
        issues=issues,
        blur_variance=blur_variance,
        mean_brightness=mean_brightness,
    )
