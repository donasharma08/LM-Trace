"""
Software-only scale calibration using the product's own printed
barcode instead of a physical marker.

GS1 standard nominal width for EAN-13 is 37.29mm at 1x magnification.
Detect the barcode's pixel width, convert to mm-per-pixel from that.

Honest limitation: GS1 permits barcode magnification between 0.8x and
2x, and the image alone can't tell you which magnification a given
package used. Most Indian retail packaging uses close to 1x, so this
is a reasonable default, not a guarantee. When no barcode is found,
calibration returns found=False -- callers must not invent a scale.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from pyzbar import pyzbar

EAN13_NOMINAL_WIDTH_MM = 37.29
ASSUMED_MAGNIFICATION = 1.0  # can't be verified from the image alone -- documented limitation


@dataclass
class CalibrationResult:
    found: bool
    mm_per_pixel: float | None = None
    barcode_type: str | None = None
    confidence_note: str = ""


def calibrate(image_bgr: np.ndarray) -> CalibrationResult:
    barcodes = pyzbar.decode(image_bgr)
    if not barcodes:
        return CalibrationResult(found=False, confidence_note="No barcode detected in frame.")

    barcode = max(barcodes, key=lambda b: b.rect.width * b.rect.height)
    pixel_width = barcode.rect.width

    real_width_mm = EAN13_NOMINAL_WIDTH_MM * ASSUMED_MAGNIFICATION
    mm_per_pixel = real_width_mm / pixel_width

    return CalibrationResult(
        found=True,
        mm_per_pixel=mm_per_pixel,
        barcode_type=barcode.type,
        confidence_note=(
            "Calibrated from barcode width, assuming 1x GS1 magnification. "
            "Actual printed magnification (0.8x-2x permitted) cannot be verified "
            "from the image alone -- treat font-size results as an estimate."
        ),
    )
