from datetime import datetime

from pydantic import BaseModel


class DeclarationOut(BaseModel):
    id: str
    label: str
    required: bool
    found: bool
    status: str  # "pass" | "potential_non_compliance" | "review_required"
    matched_text: str | None = None
    measured_height_mm: float | None = None
    min_required_height_mm: float | None = None
    notes: list[str] = []
    rule_version: str | None = None
    rule_source: str | None = None


class ScanResultOut(BaseModel):
    scan_id: str
    product_name: str
    overall_status: str
    calibrated: bool
    declarations: list[DeclarationOut]
    structural_flags: list[dict]
    company_note: str | None = None
    created_at: datetime


class ProductSummaryOut(BaseModel):
    id: str
    name: str
    last_scan_id: str | None
    last_scan_status: str | None
    last_scanned_at: datetime | None
    total_scans: int


class CompanyOut(BaseModel):
    id: str
    name_raw: str
    total_scans: int
    non_compliant_count: int


class DashboardStatsOut(BaseModel):
    total_products: int
    total_scans: int
    pass_count: int
    potential_non_compliance_count: int
    review_required_count: int
    repeat_offender_companies: int
