## F1-NEXUS Code Map & Issues Checklist

This document maps key areas of the F1-NEXUS repository and provides a prioritized checklist of known or likely issues to review and fix. Use this as a starting audit for developers onboarding into the project.

### How to use

- Walk the repository sections listed below.
- For each area, open the referenced files and run the checklist items.
- Mark items as done as you fix them and add small notes about decisions.

---

## 1. Root / Project Layout

Files/folders: repository root, `README.md`, workspace layout

- Checklist
  - [ ] Ensure `README.md` has accurate running/setup instructions (dev server, ETL steps).
  - [ ] Confirm repository license and contribution guide are present.
  - [ ] Validate top-level package manifests (`package.json`, `requirements.txt`) reflect current deps.

Notes: There are multiple subprojects (`f1-predictor-full`, Python `etl`, scripts). Keep top-level docs updated.

---

## 2. Frontend (next.js app in `f1-predictor-full`)

Location: `f1-predictor-full/`
Key files: `next.config.js`, `package.json`, `app/`, `components/Navbar.tsx`, `styles/globals.css`.

- Checklist
  - [ ] Run `npm install` and `npm run dev` to detect missing deps or runtime errors.
  - [ ] Verify `next.config.js` and `tsconfig.json` settings for production readiness (basePath, images, env).
  - [ ] Ensure `app/layout.tsx` and `app/page.tsx` have proper metadata and accessible markup (H1 usage).
  - [ ] Test Chart.js visualizations (if present) and ensure `public/templates/` assets load.
  - [ ] Confirm Tailwind config and global styles compile without warnings.

Common issues to watch for

- Missing or mismatched React/Next types in `tsconfig` causing build errors.
- Unhandled exceptions in client code (e.g., parsing CSV uploads) causing UI crash.

---

## 3. Core prediction logic (`lib/` and `worker.js`)

Location: `f1-predictor-full/lib/`, top-level `worker.js`, `F1/worker.js`
Key files: `lib/driver-data.ts`, `lib/prediction.ts`, `worker.js`

- Checklist
  - [ ] Review `weightRow` implementation and ensure unit conversions and z-score handling are correct.
  - [ ] Add/confirm unit tests for critical functions (weights, tfMultiplier, parseUltimas5).
  - [ ] Ensure Web Worker message contract is documented and stable (inputs/outputs).
  - [ ] Run simulation smoke test to validate expected output shapes: wins, top3, expectedPos.

Common issues

- Numeric stability (NaN/Infinity) when dividing by zero or missing fields.
- Schema drift between legacy and new schema handling; add clear converter tests.

---

## 4. ETL (Python) `etl/` and scripts

Location: `f1-predictor-full/etl/` and top-level `F1/etl/`
Key files: `etl/etl.py`, `etl/requirements.txt`, `scripts/*.py` (`version_demo`), `tools/`

- Checklist
  - [ ] Confirm Python requirements (`etl/requirements.txt`) are installable in a supported Python version.
  - [ ] Run static checks (flake8/ruff) and unit tests for `version_utils.py` and others.
  - [ ] Ensure FastF1 cache usage is configured (see README in `f1-predictor-full/etl`).
  - [ ] Verify ETL scripts have graceful network error handling and caching paths use env-configurable directories.

Common issues

- SSL/network issues when calling external APIs (Open-Meteo, FastF1). See `PROBLEMA_SSL_RESOLVIDO.md` notes.
- Missing error handling for empty or corrupt CSV inputs.

---

## 5. Tests and CI

Location: `tests/`, root-level test files in `F1/`

- Checklist
  - [ ] Run Python unit tests (e.g., `tests/test_version_utils.py`) and fix failures.
  - [ ] Add Node/Next tests (Jest/Playwright) if not present for critical UI flows.
  - [ ] Ensure CI config (if present) runs tests and lints on PRs.

Common issues

- Broken or missing test dependencies; inconsistent Python versions between dev machines.

---

## 6. Scripts & Utilities

Files: `scripts/`, `F1/` helper JS and README artifacts

- Checklist
  - [ ] Audit `scripts/version_demo.py` and similar utilities for Python 3.11+ compatibility.
  - [ ] Confirm `app_local_api.js` and `app.js` examples run or document deprecation.

---

## 7. Data & sample files

Location: `public/templates/`, `F1/` CSV files

- Checklist
  - [ ] Validate sample CSVs (e.g., `f1_monza2025_sample_upload.csv`) match expected schema and headers.
  - [ ] Add schema doc link or sample JSON schema in `docs/` for dataset validation.

---

## 8. Documentation & meta files

Files: `README.md`, `docs/`, `COMPREHENSIVE_REVIEW.md`, `CSV_API_EXPLANATION.md`

- Checklist
  - [ ] Ensure documentation lists how to run ETL, run frontend, run simulations, and run tests.
  - [ ] Add a quick troubleshooting section for common SSL/API issues.

---

## 9. Security & secrets

Checklist

- [ ] Confirm no secrets or credentials are checked into source (search for `API_KEY`, `TOKEN`, or `.env` with values).
- [ ] Add guidance for using environment variables for API keys and for `fastf1` cache path.

---

## 10. Immediate high-priority issues (quick wins)

- [ ] Fix failing Python unit tests in `tests/test_version_utils.py` (if any).
- [ ] Add `CODEOWNERS` or maintainers section to README to know who to contact.
- [ ] Add a `CONTRIBUTING.md` with setup steps for local dev (node & python envs).

---

## Appendix: Short triage checklist for a new developer

1. Clone repo and install Node and Python dependencies.
2. Start Next dev server and run `python -m pytest` in the repo root.
3. Run one ETL script generating CSV into `build/` and open the frontend upload sample.
4. Execute a small simulation using `worker.js` sample harness (if present).

---

If you'd like, I can also:

- run tests now and fix failing `version_utils` tests;
- open `f1-predictor-full` and run the Next dev server to capture runtime errors;
- or generate a PR with the fixes.

---

Generated on 2025-09-17 by automated codemap generator.
