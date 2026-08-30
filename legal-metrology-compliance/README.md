# Legal Metrology Compliance Console — SIH26034

Automated screening of packaged-commodity labels against the Legal Metrology
(Packaged Commodities) Rules, 2011. Single-panel inspection officer MVP.

## What this build does

1. **Upload → quality check → calibrate → OCR → validate → report**, one pipeline.
   - Officer uploads a front-panel photo (camera capture or gallery/file picker)
     and, optionally, a back-panel photo.
   - `quality_service.py` rejects blurry/glared/dark images before OCR runs.
   - `barcode_service.py` detects the product's own printed barcode and derives
     a mm-per-pixel scale from its standard GS1 width — **no physical marker,
     no printing required.** Accuracy assumes 1x magnification; see the module
     docstring for the documented limitation.
   - `ocr_service.py` (EasyOCR) extracts text + bounding boxes from each
     photographed panel and merges them.
   - `rule_engine.py` checks each Rule 6 declaration and returns one of three
     states per field and overall:
     - **PASS** — found and, where applicable, measured within the Rule 7 threshold
     - **POTENTIAL_NON_COMPLIANCE** — checked against full evidence and failed
       (missing across all photographed panels, wrong format, undersized font)
     - **REVIEW_REQUIRED** — evidence is incomplete (only one panel photographed,
       or no barcode in frame for font measurement) — never silently treated as
       a violation just because the officer didn't photograph everything
   - `evidence_service.py` draws a box on the original image for every matched
     declaration, so findings are visually traceable, not just asserted.
   - `report_service.py` renders PDF and editable DOCX reports with the 3-state
     verdict, rule version/source per line, and a repeat-offender note if applicable.
2. **Company repeat-offender tracking** — `company_service.py` normalizes the
   extracted manufacturer/packer/importer name and groups scans under one
   company record. A non-compliant scan increments that company's count;
   the dashboard surfaces companies with more than one non-compliant scan.
3. **Repository & search** — every scan stored in Supabase Postgres; dashboard
   lists products with status, search, and 3-state filtering.
4. **Single-role auth** — one inspection-officer panel, Supabase Auth JWT
   verified server-side. No admin/authority split in this build.
5. **Re-scan lineage** — a scan can reference `re_scan_of` a prior scan id.

## What this build deliberately does NOT claim to do

- **Semantic "misleading declaration" detection.** Judging deceptive framing
  needs contextual reasoning a rule engine can't honestly provide. The one
  structural heuristic implemented (MRP without an "inclusive of all taxes"
  phrase) is surfaced as a manual-review flag, never an automated violation.
- **Guaranteed-accurate font-size measurement.** Barcode-based calibration
  assumes 1x GS1 magnification, which can't be verified from the image alone
  (GS1 permits 0.8x–2x). Treat font-size figures as an estimate, not a legal
  certification — this is stated on every generated report.
- **Multi-portal / supervisor analytics / industry pre-market self-check.**
  Explicitly out of scope for this MVP — single officer panel only.

## Architecture

```
frontend (React + Vite + Tailwind)
   │  fetch, Supabase Auth session
   ▼
backend (FastAPI)
   ├── routers/scan.py       -- upload endpoint, orchestrates the full pipeline
   ├── routers/products.py   -- repository listing, search, dashboard stats, repeat offenders
   ├── routers/reports.py    -- PDF / DOCX export
   ├── routers/auth.py       -- JWT verification (single role)
   └── services/
        ├── quality_service.py    -- blur/glare/brightness gate, runs first
        ├── barcode_service.py    -- software-only mm/px calibration via barcode width
        ├── ocr_service.py        -- EasyOCR wrapper, multi-panel merge, region↔field mapping
        ├── rule_engine.py        -- 3-state Rule 6/7 checks, driven by rules/lm_pc_rules_2011.json
        ├── evidence_service.py   -- draws matched-declaration bounding boxes on the image
        ├── company_service.py    -- manufacturer name normalization + repeat-offender counts
        └── report_service.py     -- WeasyPrint (PDF) + python-docx (editable)
   ▼
Supabase (Postgres + Auth + Storage) -- see supabase/schema.sql
```

## Running locally

**Backend**
```
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your Supabase project's URL/keys
uvicorn app.main:app --reload
```

**Frontend**
```
cd frontend
npm install
cp .env.example .env.local   # fill in matching Supabase URL/anon key
npm run dev
```

**Supabase**
- Create a project, run `supabase/schema.sql` in the SQL editor.
- Create a Storage bucket named `evidence-photos`.
- Create at least one officer account in Authentication → Users — no role
  metadata needed, every authenticated user is an inspection officer.

## Known gaps before this is submission-ready

- `font_size_rules.area_brackets_mm` in `rules/lm_pc_rules_2011.json` holds
  placeholder Table-I/II values — verify against the current gazetted text at
  consumeraffairs.gov.in before relying on them for anything beyond a demo.
- Barcode calibration assumes 1x GS1 magnification (see `barcode_service.py`
  docstring) — a package printed at a different magnification will produce a
  proportionally wrong mm figure. No way to detect this from the image alone.
- Company name matching (`company_service.normalize_company_name`) is simple
  string normalization, not fuzzy/entity matching — inconsistent OCR of the
  same company's name across scans can under- or over-merge records.
- `map_regions_to_fields` uses substring matching to connect a validated
  declaration back to its OCR bounding box; multi-line declarations split by
  OCR into several regions aren't guaranteed to match.
- No automated test coverage yet for `barcode_service.py`, `ocr_service.py`,
  or `quality_service.py` (all need real label photos to test meaningfully) —
  `backend/tests/test_rule_engine.py` covers the pure-logic rule engine,
  including the not-detected-vs-verified-absent distinction, and passes.
- Frontend build verified (`npm run build` succeeds); no live Supabase project
  has been created yet, so the full pipeline hasn't run against a real photo.
