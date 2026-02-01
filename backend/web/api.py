from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from pydantic import BaseModel
import jwt
import datetime
import bcrypt



import sys
import os
import shutil
from pathlib import Path
import datetime

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.dmarc_lib.parser import parse_report
from backend.dmarc_lib.db import (
    init_db, save_report, get_stats, get_reports_list, 
    get_report_detail, delete_reports, get_domain_stats, 
    get_user_profile, update_user_profile, get_user_by_username,
    list_users, create_user, delete_user
)



app = FastAPI(title="DMARC Report Manager")

# CONFIG
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

from backend.web import config

security = HTTPBearer()


# Enable CORS for Frontend
# Note: allow_credentials must be False if allow_origins is ["*"]
allow_all = "*" in config.CORS_ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOWED_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Total-Count"],
)


# Pydantic models
class UserProfile(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(UserProfile):
    username: str
    password: str
    role: str = "user"


# Auth Helper
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user_by_username(username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user

@app.post("/api/login")
async def login(req: LoginRequest):
    user = get_user_by_username(req.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password using bcrypt
    password_bytes = req.password.encode('utf-8')
    password_hash_bytes = user['password_hash'].encode('utf-8')
    
    if not bcrypt.checkpw(password_bytes, password_hash_bytes):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"sub": user['username'], "exp": expires, "role": user['role']}
    token = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "username": user['username'],
            "first_name": user['first_name'],
            "last_name": user['last_name'],
            "role": user['role']
        }
    }

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
async def stats(start: Optional[int] = None, end: Optional[int] = None, request: Request = None):
    # Check if user is logged in to decide visibility
    user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
            user = get_user_by_username(payload.get("sub"))
        except:
            pass

    data = get_stats(start_date=start, end_date=end)
    
    # If not logged in, strip sensitive data
    if not user:
        # User requested: Dashboard should only show the domain if you are logged in, otherwise leave the column out.
        # This applied to recent_activity items.
        if "recent_activity" in data:
            for item in data["recent_activity"]:
                if "domain" in item:
                    del item["domain"]
    
    return data

@app.get("/api/reports")
async def reports_list(page: int = 1, limit: int = 50, search: Optional[str] = None, domain: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    return get_reports_list(page=page, page_size=limit, search=search, domain=domain)

@app.get("/api/reports/{id}")
async def report_detail(id: str, current_user: dict = Depends(get_current_user)):
    report = get_report_detail(id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...), background_tasks: BackgroundTasks = None, current_user: dict = Depends(get_current_user)):
    # ... (same logic)
    uploaded_files = []
    for file in files:
        file_path = UPLOAD_DIR / file.filename
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append(file.filename)
            if background_tasks:
                background_tasks.add_task(process_single_file, file_path)
            else:
                process_single_file(file_path)
        except Exception as e:
            return JSONResponse(status_code=500, content={"message": f"Failed to save {file.filename}"})
    return {"message": f"Uploaded {len(uploaded_files)} files", "files": uploaded_files}

@app.delete("/api/reports")
async def delete_reports_endpoint(start: Optional[int] = None, end: Optional[int] = None, domain: Optional[str] = None, org_name: Optional[str] = None, days: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    deleted = delete_reports(start_date=start, end_date=end, domain=domain, org_name=org_name, days=days)
    return {"deleted": deleted}

@app.get("/api/domains")
async def domains_list(current_user: dict = Depends(get_current_user)):
    return get_domain_stats()


@app.get("/api/user/profile")
async def user_profile(current_user: dict = Depends(get_current_user)):
    """Get the profile of the current user."""
    return current_user

@app.put("/api/user/profile")
async def update_profile(profile: UserProfile, current_user: dict = Depends(get_current_user)):
    """Update the profile of the current user."""
    success = update_user_profile(current_user['id'], profile.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return {"message": "Profile updated successfully"}

# User Management (Admin Only)
@app.get("/api/users")
async def get_users(admin: dict = Depends(get_admin_user)):
    return list_users()

@app.post("/api/users")
async def add_user(user: UserCreate, admin: dict = Depends(get_admin_user)):
    new_id = create_user(user.dict())
    if not new_id:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    return {"id": new_id, "message": "User created successfully"}

@app.delete("/api/users/{id}")
async def remove_user(id: int, admin: dict = Depends(get_admin_user)):
    if id == admin['id']:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    delete_user(id)
    return {"message": "User deleted successfully"}




