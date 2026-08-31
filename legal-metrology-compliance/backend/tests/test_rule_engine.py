import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.rule_engine import RuleEngine, Status  # noqa: E402

COMPLIANT_LABEL = """
FreshBite Instant Noodles
Net Wt: 70g
MRP: Rs. 20.00 (Inclusive of all taxes)
Mfg Date: 03/2026
Mfg by: FreshBite Foods Pvt Ltd, MIDC Industrial Area, Pune, Maharashtra 411018
Consumer Care: 1800-123-4567, care@freshbite.example
"""

INCOMPLETE_LABEL_SINGLE_PANEL = """
FreshBite Instant Noodles
Net Wt: 70g
"""


def test_compliant_label_with_full_evidence_passes():
    """Full pass requires BOTH complete declarations AND barcode
    calibration for the font-checked fields -- without calibration,
    font-size correctly stays REVIEW_REQUIRED rather than a silent pass."""
    engine = RuleEngine()
    regions = [
        {"field_id": "mrp", "text": "MRP", "bbox_height_px": 30},
        {"field_id": "net_quantity", "text": "Net Wt", "bbox_height_px": 30},
    ]
    result = engine.evaluate(
        COMPLIANT_LABEL, text_regions=regions, panels_photographed=2, mm_per_pixel=0.1
    )
    assert result.overall_status == Status.PASS.value


def test_compliant_text_without_calibration_is_review_not_a_silent_pass():
    engine = RuleEngine()
    result = engine.evaluate(COMPLIANT_LABEL, panels_photographed=2)
    assert result.overall_status == Status.REVIEW_REQUIRED.value


def test_single_panel_missing_fields_are_review_not_fail():
    """Core 3-state principle: not detected in ONE photographed panel
    must not be treated as a confirmed violation."""
    engine = RuleEngine()
    result = engine.evaluate(INCOMPLETE_LABEL_SINGLE_PANEL, panels_photographed=1)
    mrp_result = next(d for d in result.declarations if d.id == "mrp")
    assert mrp_result.status == Status.REVIEW_REQUIRED.value
    assert result.overall_status == Status.REVIEW_REQUIRED.value


def test_missing_fields_with_full_panel_coverage_are_potential_non_compliance():
    """Same missing text, but officer confirmed both panels were
    photographed -- now it's a real signal, not just missing evidence."""
    engine = RuleEngine()
    result = engine.evaluate(INCOMPLETE_LABEL_SINGLE_PANEL, panels_photographed=2)
    mrp_result = next(d for d in result.declarations if d.id == "mrp")
    assert mrp_result.status == Status.POTENTIAL_NON_COMPLIANCE.value
    assert result.overall_status == Status.POTENTIAL_NON_COMPLIANCE.value


def test_font_size_without_barcode_calibration_is_review_not_fabricated():
    engine = RuleEngine()
    result = engine.evaluate(COMPLIANT_LABEL, panels_photographed=2, mm_per_pixel=None)
    mrp_result = next(d for d in result.declarations if d.id == "mrp")
    assert mrp_result.measured_height_mm is None
    assert mrp_result.status == Status.REVIEW_REQUIRED.value
    assert result.calibrated is False


def test_font_size_with_barcode_calibration_measures_real_mm():
    engine = RuleEngine()
    regions = [{"field_id": "mrp", "text": "MRP", "bbox_height_px": 30}]
    result = engine.evaluate(
        COMPLIANT_LABEL, text_regions=regions, panels_photographed=2, mm_per_pixel=0.1
    )
    mrp_result = next(d for d in result.declarations if d.id == "mrp")
    assert mrp_result.measured_height_mm == 3.0
    assert mrp_result.status == Status.PASS.value
    assert result.calibrated is True


if __name__ == "__main__":
    test_compliant_label_with_full_evidence_passes()
    test_compliant_text_without_calibration_is_review_not_a_silent_pass()
    test_single_panel_missing_fields_are_review_not_fail()
    test_missing_fields_with_full_panel_coverage_are_potential_non_compliance()
    test_font_size_without_barcode_calibration_is_review_not_fabricated()
    test_font_size_with_barcode_calibration_measures_real_mm()
    print("All rule engine tests passed.")
