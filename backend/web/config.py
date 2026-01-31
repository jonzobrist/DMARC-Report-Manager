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
    if "*" in ALLOWED_HOSTS:
        CORS_ALLOWED_ORIGINS = ["*"]
    else:
        for host in ALLOWED_HOSTS:
            CORS_ALLOWED_ORIGINS.append(f"http://{host}")
            CORS_ALLOWED_ORIGINS.append(f"https://{host}")
            # Also support common dev ports if localhost
            if host in ["localhost", "127.0.0.1"]:
                 CORS_ALLOWED_ORIGINS.append(f"http://{host}:5173")
                 CORS_ALLOWED_ORIGINS.append(f"http://{host}:8101")

SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-me-in-production")
DB_PATH = os.environ.get("DB_PATH", "dmarc_reports.db")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours
