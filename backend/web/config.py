import os
from typing import List
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

def get_list(env_var: str, default: List[str] = []) -> List[str]:
    val = os.environ.get(env_var)
    if not val:
        return default
    return [item.strip() for item in val.split(",") if item.strip()]

APP_HOST = os.environ.get("APP_HOST", "127.0.0.1")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "8000"))
ALLOWED_HOSTS = get_list("ALLOWED_HOSTS", ["localhost", "127.0.0.1"])
CORS_ALLOWED_ORIGINS = get_list("CORS_ALLOWED_ORIGINS", [])

# If CORS_ALLOWED_ORIGINS is empty, derive from ALLOWED_HOSTS for convenience
if not CORS_ALLOWED_ORIGINS:
    # Get configured ports
    f_port = os.environ.get("FRONTEND_PORT", "5173")
    b_port = os.environ.get("BACKEND_PORT", "8080") # Fallback to common port
    
    for host in ALLOWED_HOSTS:
        if host == "*":
            CORS_ALLOWED_ORIGINS = ["*"]
            break
        
        # Standard protocols (no port = 80/443 effectively)
        CORS_ALLOWED_ORIGINS.append(f"http://{host}")
        CORS_ALLOWED_ORIGINS.append(f"https://{host}")
        
        # Both common and configured ports
        for port in [f_port, b_port, "5173", "8000", "8100", "8101", "3000"]:
            CORS_ALLOWED_ORIGINS.append(f"http://{host}:{port}")
            CORS_ALLOWED_ORIGINS.append(f"https://{host}:{port}")

# Ensure uniqueness and strip trailing slashes
if "*" not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = sorted(list(set([o.rstrip("/") for o in CORS_ALLOWED_ORIGINS if o])))
else:
    CORS_ALLOWED_ORIGINS = ["*"]

SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-me-in-production")
DB_PATH = os.environ.get("DB_PATH", "dmarc_reports.db")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours
