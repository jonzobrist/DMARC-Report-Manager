import pytest
from fastapi.testclient import TestClient
import os
import sys
# Ensure project root is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.web.api import app
from backend.dmarc_lib.db import init_db

client = TestClient(app)

def _auth_headers():
    init_db()
    res = client.post("/api/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "DMARC Report Manager Backend is running"}

def test_get_version():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert "version" in response.json()

def test_get_files():
    response = client.get("/api/files", headers=_auth_headers())
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_stats():
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data
    assert "total_volume" in data

def test_get_reports():
    response = client.get("/api/reports", headers=_auth_headers())
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

def test_get_domains():
    response = client.get("/api/domains", headers=_auth_headers())
    assert response.status_code == 200
    assert isinstance(response.json(), list)
