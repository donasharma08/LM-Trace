"""
Rule-based compliance validator for the Legal Metrology (Packaged
Commodities) Rules, 2011.

Three-state model, not binary pass/fail: a declaration not found in
the submitted photo is NOT the same as a declaration verified absent
from the product. If the officer only photographed the front panel,
a back-panel declaration should read REVIEW_REQUIRED, not FAIL --
only a regex/format mismatch on text that WAS actually read counts
as a firm violation.

Font-size measurement uses barcode-based calibration
(services/barcode_service.py) -- software-only, no physical marker.
When no barcode is detected, font-size fields fall back to
REVIEW_REQUIRED rather than a fabricated pass/fail.

"Misleading" declarations are explicitly out of scope for automated
detection -- see `structural_flags` for the one honest, narrow
heuristic substitute, always surfaced as a manual-review flag.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "lm_pc_rules_2011.json"


class Status(str, Enum):
    PASS = "pass"
    POTENTIAL_NON_COMPLIANCE = "potential_non_compliance"
    REVIEW_REQUIRED = "review_required"


@dataclass
class DeclarationResult:
    id: str
    label: str
    required: bool
    found: bool
    status: str
    matched_text: str | None = None
    measured_height_mm: float | None = None
    min_required_height_mm: float | None = None
    notes: list[str] = field(default_factory=list)
    rule_version: str | None = None
    rule_source: str | None = None
    bbox_px: list | None = None  # [[x,y]x4] on the primary image, for the interactive evidence overlay


@dataclass
class ComplianceResult:
    overall_status: str
    declarations: list[DeclarationResult]
    structural_flags: list[dict[str, Any]]
    calibrated: bool  # whether barcode-based mm/px calibration was available


class RuleEngine:
    def __init__(self, rules_path: Path = RULES_PATH):
        with open(rules_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        self.declaration_rules = self.config["mandatory_declarations"]
        self.font_rules = self.config["font_size_rules"]
        self.structural_checks = self.config["structural_flags"]["checks"]

    def _min_height_for_area(self, area_cm2: float | None) -> float:
        if area_cm2 is None:
            return self.font_rules["default_min_height_mm"]
        for bracket in self.font_rules["area_brackets_mm"]:
            if bracket["max_area_cm2"] is None or area_cm2 <= bracket["max_area_cm2"]:
                return bracket["min_height_mm"]
        return self.font_rules["area_brackets_mm"][-1]["min_height_mm"]

    def evaluate(
        self,
        extracted_text: str,
        text_regions: list[dict] | None = None,
        is_imported: bool = False,
        panel_area_cm2: float | None = None,
        mm_per_pixel: float | None = None,
        panels_photographed: int = 1,
    ) -> ComplianceResult:
        """
        panels_photographed: how many label panels (front/back/etc) were
        submitted for this scan -- used to decide whether a not-found
        declaration should read REVIEW_REQUIRED (evidence may simply be
        incomplete) vs POTENTIAL_NON_COMPLIANCE (all expected panels were
        provided and it's still not there).
        """
        text_regions = text_regions or []
        region_by_field = {r["field_id"]: r for r in text_regions if "field_id" in r}
        results: list[DeclarationResult] = []

        for rule in self.declaration_rules:
            if rule["id"] == "country_of_origin" and not is_imported:
                continue

            found, matched = self._check_presence(rule, extracted_text)
            notes: list[str] = []

            if found:
                status = Status.PASS
            else:
                if rule.get("required", True):
                    status = (
                        Status.REVIEW_REQUIRED
                        if panels_photographed < 2
                        else Status.POTENTIAL_NON_COMPLIANCE
                    )
                    notes.append(
                        "Not detected in submitted image(s) -- "
                        + (
                            "photograph additional panels before treating this as a violation."
                            if status == Status.REVIEW_REQUIRED
                            else "not found across all submitted panels."
                        )
                    )
                else:
                    status = Status.PASS

            result = DeclarationResult(
                id=rule["id"],
                label=rule["label"],
                required=rule.get("required", True),
                found=found,
                status=status.value,
                matched_text=matched,
                notes=notes,
                rule_version=rule.get("rule_version"),
                rule_source=rule.get("source"),
                bbox_px=region_by_field.get(rule["id"], {}).get("bbox_px") if found else None,
            )

            if found and rule.get("font_checked"):
                region = region_by_field.get(rule["id"])
                min_h = self._min_height_for_area(panel_area_cm2)
                result.min_required_height_mm = min_h
                if region and mm_per_pixel:
                    measured_mm = region["bbox_height_px"] * mm_per_pixel
                    result.measured_height_mm = round(measured_mm, 2)
                    if measured_mm < min_h:
                        result.status = Status.POTENTIAL_NON_COMPLIANCE.value
                        result.notes.append(
                            f"Measured font height {measured_mm:.2f}mm is below the "
                            f"required {min_h}mm minimum (barcode-calibrated estimate)."
                        )
                else:
                    # found the declaration but can't measure it -- REVIEW, not a guess
                    if result.status == Status.PASS.value:
                        result.status = Status.REVIEW_REQUIRED.value
                    result.notes.append(
                        "Font size not measured -- no barcode detected in frame for calibration."
                    )

            if found and rule["id"] == "mrp":
                if not re.search(r"inclusive of.*tax", extracted_text, re.IGNORECASE):
                    if result.status == Status.PASS.value:
                        result.status = Status.POTENTIAL_NON_COMPLIANCE.value
                    result.notes.append(
                        "MRP found but no nearby 'inclusive of all taxes' qualifier detected."
                    )

            results.append(result)

        structural_flags = self._run_structural_flags(extracted_text)
        overall_status = self._rollup_status(results)

        return ComplianceResult(
            overall_status=overall_status,
            declarations=results,
            structural_flags=structural_flags,
            calibrated=mm_per_pixel is not None,
        )

    def _rollup_status(self, results: list[DeclarationResult]) -> str:
        required = [r for r in results if r.required]
        if any(r.status == Status.POTENTIAL_NON_COMPLIANCE.value for r in required):
            return Status.POTENTIAL_NON_COMPLIANCE.value
        if any(r.status == Status.REVIEW_REQUIRED.value for r in required):
            return Status.REVIEW_REQUIRED.value
        return Status.PASS.value

    def _check_presence(self, rule: dict, text: str) -> tuple[bool, str | None]:
        hint = rule.get("extraction_hint")
        if hint == "regex" and rule.get("regex"):
            m = re.search(rule["regex"], text, re.IGNORECASE)
            return (bool(m), m.group(0) if m else None)
        if hint == "keywords" and rule.get("keywords"):
            for kw in rule["keywords"]:
                idx = text.lower().find(kw.lower())
                if idx != -1:
                    return (True, text[idx: idx + 100])
            return (False, None)
        if hint == "heuristic_title_line":
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            for line in lines[:5]:
                if len(line) >= 3 and any(c.isalpha() for c in line):
                    return (True, line)
            return (False, None)
        return (False, None)

    def _run_structural_flags(self, text: str) -> list[dict]:
        flags = []
        for check in self.structural_checks:
            if check["id"] == "mrp_without_inclusive_tax_phrase":
                if re.search(r"(mrp|m\.r\.p)", text, re.IGNORECASE) and not re.search(
                    r"inclusive of.*tax", text, re.IGNORECASE
                ):
                    flags.append({**check, "confidence": "low", "review_required": True})
        return flags
