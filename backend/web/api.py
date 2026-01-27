from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
import shutil
from pathlib import Path
import datetime

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.dmarc_lib.parser import parse_report
from backend.dmarc_lib.db import init_db, save_report, get_stats, get_reports_list, get_report_detail, delete_reports, get_domain_stats

app = FastAPI(title="DMARC Report Manager")

# CONFIG
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {"message": "DMARC Report Manager Backend is running"}

@app.get("/api/version")
async def get_version():
    try:
        with open("version.txt", "r") as f:
            return {"version": f.read().strip()}
    except Exception:
        return {"version": "0.0.0"}


@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...), background_tasks: BackgroundTasks = None):
    uploaded_files = []
    
    for file in files:
        file_path = UPLOAD_DIR / file.filename
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            uploaded_files.append(file.filename)
            
            # Auto-process after upload
            if background_tasks:
                background_tasks.add_task(process_single_file, file_path)
            else:
                 # If no background tasks context (unlikely in Fastapi route), do sync
                 process_single_file(file_path)

        except Exception as e:
            print(f"Error saving {file.filename}: {e}")
            return JSONResponse(status_code=500, content={"message": f"Failed to save {file.filename}"})
            
    return {"message": f"Uploaded {len(uploaded_files)} files", "files": uploaded_files}

def process_single_file(file_path: Path):
    try:
        print(f"Processing uploaded file: {file_path}")
        data = parse_report(file_path)
        save_report(data)
        print(f"Successfully processed {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

@app.get("/api/files")
async def list_files():
    files = []
    for f in UPLOAD_DIR.glob("*"):
        if f.is_file():
            stat = f.stat()
            files.append({
                "name": f.name,
                "size": stat.st_size,
                "created": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "processed": True # TODO: track processed state in DB or simple check
            })
    # Sort by created desc
    files.sort(key=lambda x: x['created'], reverse=True)
    return files

@app.delete("/api/files/{filename}")
async def delete_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, message="File not found")
    try:
        file_path.unlink()
        return {"message": f"Deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def stats(start: Optional[int] = None, end: Optional[int] = None):
    """
    Get aggregated stats for the dashboard.
    Optional query params:
    - start: Unix timestamp in seconds
    - end: Unix timestamp in seconds
    """
    return get_stats(start_date=start, end_date=end)

@app.get("/api/reports")
async def reports_list(page: int = 1, limit: int = 50, search: Optional[str] = None, domain: Optional[str] = None):
    return get_reports_list(page=page, page_size=limit, search=search, domain=domain)


@app.get("/api/reports/{id}")
async def report_detail(id: str):
    """
    Get details for a specific report.
    """
    report = get_report_detail(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.delete("/api/reports")
async def delete_reports_endpoint(start: Optional[int] = None, end: Optional[int] = None, domain: Optional[str] = None, org_name: Optional[str] = None, days: Optional[int] = None):
    """Delete reports based on optional filters.
    Returns number of deleted reports.
    """
    deleted = delete_reports(start_date=start, end_date=end, domain=domain, org_name=org_name, days=days)
    return {"deleted": deleted}
@app.get("/api/domains")
async def domains_list():
    """Get aggregated stats for all unique domains."""
    return get_domain_stats()


