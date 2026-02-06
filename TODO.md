# TODO List for DMARC Report Manager

## Backend
- [x] Multi-Format Parsing (XML, ZIP, GZIP, XZ)
- [x] API backend with FastAPI
- [x] CLI for import, troubleshoot, etc.
- [x] SQLite database schema for reports
- [x] Persistence of report metadata and records
- [x] Bulk report deletion endpoint (`DELETE /api/reports`)
- [x] User profile management (Settings page)
- [x] Implement authentication & authorization (Full Auth)

- [x] Write comprehensive unit tests for parsing and API
- [ ] CI pipeline for automated testing
- [ ] Security + API hardening
- [ ] Data integrity + DB cleanup
- [ ] Backend reliability polish


## Frontend
- [x] Interactive Dashboard with Recharts
- [x] File Manager component for uploading reports
- [x] Compliance pie chart visualization
- [x] Bulk report deletion (Flush Reports) in Web UI
- [x] Domain List page (filter reports by domain)
- [x] Enhanced filtering and search UI


- [ ] Responsive design for mobile devices
- [ ] Dark mode support
- [ ] End-to-end tests (Cypress or Playwright)

## CLI Tools
- [x] `bin/import-dmarc`: Batch upload reports via API
- [x] `bin/list-reports`: List/search reports with domain/date filters
- [x] `bin/get-report`: Fetch detailed single report
- [x] `bin/report-summary`: Overview of stats with relative date support
- [x] `bin/flush-reports`: Direct DB bulk deletion tool
- [x] `bin/reset-admin-password`: CLI utility to reset admin password


## Documentation
- [x] Updated README with installation and usage
- [x] Current Features section added to README
- [x] Comprehensive TODO.md checklist
- [x] Contribution guidelines (with documentation rule)

- [x] API documentation (OpenAPI spec details)

## Testing & Verification
- [x] Manual testing of backend endpoints via Swagger UI
- [x] Manual testing of frontend UI in Chrome
- [x] Automated test suite integration


## Proposed Work Groups (Minimal Context Switching)

### Group A: API Security & Auth Consistency
- [x] Remove duplicate unauthenticated `/api/upload` and keep only auth-protected version (`backend/web/api.py`)
- [x] Sanitize uploaded filenames and delete targets to prevent path traversal (`backend/web/api.py`)
- [x] Decide which endpoints are public vs authenticated and align backend + frontend + tests

### Group B: Database Integrity & Deletion Semantics
- [x] Fix `delete_reports` to import `datetime`, return deleted count, and clean up `records` (`backend/dmarc_lib/db.py`)
- [x] Add cascade delete behavior or explicit cleanup for `records` when reports are removed
- [x] Add deletion tests to verify report removal + record cleanup

### Group C: Startup & Environment Reliability
- [x] Call `init_db()` at API startup to ensure schema + default admin exist
- [x] Guard production configs (require `SECRET_KEY`, avoid insecure defaults)
- [x] Replace FastAPI `on_event` startup with lifespan handler

### Deprecation Cleanup
- [x] Use timezone-aware UTC for JWT expiry timestamps

### Group D: Test Suite Updates
- [x] Update API tests to authenticate before calling protected endpoints (`tests/test_api.py`)
- [x] Add upload tests (auth + invalid filename)
- [x] Fix `test_upload_logic.py` to match current `save_report` signature

### Group E: Parsing Robustness & Format Support
- [x] Harden XML parsing and guard against malformed/huge inputs (`backend/dmarc_lib/parser.py`)
- [x] Verify README claim of XZ support; add `.xz` support or update docs


## Future Enhancements
- [ ] Email notifications for DMARC failures
- [ ] Integration with external monitoring tools
- [ ] Support for additional report formats (JSON, CSV)
- [ ] Performance optimizations for large datasets

---
*This list is a living document. Items marked with `[x]` are completed. Items marked with `[ ]` are pending.*
