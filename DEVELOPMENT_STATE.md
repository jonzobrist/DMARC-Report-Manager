# Development State Summary - DMARC Report Manager

## Project Overview
DMARC Report Manager is a self-hosted tool for parsing, analyzing, and visualizing DMARC reports. It consists of a FastAPI backend (Python), a React frontend (Vite), and a set of CLI tools for automation.

## Current Architecture
- **Backend (`/backend`)**:
    - **API**: FastAPI application in `backend/web/api.py`.
    - **Database**: SQLite database stored in `dmarc_reports.db`. Schema handles `reports` (metadata) and `records` (aggregated row data).
    - **Library**: `backend/dmarc_lib` contains the parser (XML/ZIP/GZIP support) and DB interaction logic.
- **Frontend (`/frontend`)**:
    - **React**: Built with Vite, using Recharts for data visualization and Lucide for icons.
    - **Styling**: Vanilla CSS with a focus on a "premium" dark theme.
- **CLI Tools (`/bin`)**:
    - `import-dmarc`: Batch upload reports via the API.
    - `list-reports`: List/search reports with domain/date filters.
    - `get-report`: Fetch detailed JSON for a single report.
    - `report-summary`: CLI stats overview with relative date support.
    - `flush-reports`: Direct DB bulk deletion tool.
    - `start`, `stop`, `restart`: Convenience scripts for service management.

## Recently Completed
- [x] Security Hardening: Upgraded `python-multipart` and applied `esbuild` overrides to mitigate reported vulnerabilities.
- [x] **API Documentation & Testing**: Created [API.md](API.md) and added automated tests in `tests/test_api.py`.
- [x] **Domain tracking & filtering**: Added a dedicated "Domain List" page with aggregated pass/fail stats and deep-linking to filtered reports.


- [x] **Flexible Identification**: Updated `get-report` (CLI and API) to support retrieval by either internal numerical ID or the unique `report_id` string.

- [x] **Bulk Deletion**: Implemented `DELETE /api/reports` endpoint and associated DB logic to filter by domain, org, or date range.

- [x] **Web UI Management**: Integrated "Flush Reports" modal in the File Manager to allow bulk deletion of data through the browser.
- [x] **Enhanced CLI Suite**: Created/updated scripts in `bin/` to provide full parity with backend capabilities (import, list, get, summarize, flush).
- [x] **Dashboard Reliability**: Fixed a bug where invalid date ranges caused `NaN` fetch errors by adding frontend validation.

## Next Development Steps
1. **Domain Tracking UI**: Create a dedicated "Domain List" page to see aggregate stats per domain (currently filtering works in the background but needs a UI index).
2. **Authentication**: Implement a simple JWT or API Key authentication layer for the FastAPI backend.
3. **Automated Testing**: Add `pytest` for the backend parsing logic and `Playwright` or `Cypress` for the frontend.
4. **Dark Mode / UI Polishing**: Further refine animations and add a manual dark mode toggle (currently defaults to dark).

## Getting Started for New Developers
1. **Backend**: `uv sync` to install dependencies. Run with `bin/start`.
2. **Frontend**: `cd frontend && pnpm install`. Dev server starts with `bin/start`.
3. **Database**: The `dmarc_reports.db` file is automatically initialized on first run. Use CLI tools in `bin/` to seed data.
