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
    - `reset-admin-password`: CLI utility to reset the administrator password.
    - `start`, `stop`, `restart`: Convenience scripts for service management.


## Recently Completed
- [x] **Authentication & RBAC**: Implemented a comprehensive JWT-based security system with Admin/User roles, a dedicated login flow, and fine-grained API/UI protection.
- [x] **User Management & Settings**: Added a "User Management" dashboard for admins and profile editing for all users.


- [x] **API Documentation & Testing**: Created [API.md](API.md) and added automated tests in `tests/test_api.py`.
- [x] **Domain tracking & filtering**: Added a dedicated "Domain List" page with aggregated pass/fail stats and deep-linking to filtered reports.


- [x] **Flexible Identification**: Updated `get-report` (CLI and API) to support retrieval by either internal numerical ID or the unique `report_id` string.

- [x] **Bulk Deletion**: Implemented `DELETE /api/reports` endpoint and associated DB logic to filter by domain, org, or date range.

- [x] **Web UI Management**: Integrated "Flush Reports" modal in the File Manager to allow bulk deletion of data through the browser.
- [x] **Enhanced CLI Suite**: Created/updated scripts in `bin/` to provide full parity with backend capabilities (import, list, get, summarize, flush).
- [x] **Dashboard Reliability**: Fixed a bug where invalid date ranges caused `NaN` fetch errors by adding frontend validation.

## Next Development Steps
1. **Automated Testing**: Add `pytest` for the backend parsing logic and `Playwright` or `Cypress` for the frontend.
2. **Dark Mode / UI Polishing**: Further refine animations and add a manual dark mode toggle (currently defaults to dark).
3. **Advanced Filtering**: Add multi-domain selection and more granular date presets to the dashboard.


## Getting Started for New Developers
1. **Backend (Required)**: Use `uv` for Python virtual environments. Run `uv sync` to create the `.venv` and install dependencies, then start with `bin/start`.
2. **Frontend**: `cd frontend && pnpm install`. Dev server starts with `bin/start`.
3. **Database**: The `dmarc_reports.db` file is automatically initialized on first run. Use CLI tools in `bin/` to seed data.

## Repo Hygiene
- Keep `.gitignore` updated to exclude build artifacts, virtual environments, test outputs, and logs so they are never committed.

## Task Tracking
- Update `TODO.md` whenever a task is completed so the task list remains current.
