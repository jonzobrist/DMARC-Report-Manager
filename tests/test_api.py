import pytest
from fastapi.testclient import TestClient
import os
import sys
# Ensure project root is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.web.api import app
from backend.dmarc_lib.db import init_db, save_report, get_db

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

def test_delete_reports_cascades_records():
    init_db()
    report_id = save_report({
        "metadata": {
            "org_name": "Example Org",
            "email": "ops@example.com",
            "report_id": "example-report-1",
            "date_range_begin": 1700000000,
            "date_range_end": 1700003600,
        },
        "policy": {
            "domain": "example.com",
            "p": "none",
            "sp": "none",
            "pct": "100",
        },
        "records": [
            {
                "source_ip": "1.2.3.4",
                "count": 5,
                "disposition": "none",
                "dkim": "pass",
                "spf": "pass",
            }
        ],
    })
    other_report_id = save_report({
        "metadata": {
            "org_name": "Other Org",
            "email": "ops@other.com",
            "report_id": "other-report-1",
            "date_range_begin": 1700000000,
            "date_range_end": 1700003600,
        },
        "policy": {
            "domain": "other.com",
            "p": "none",
            "sp": "none",
            "pct": "100",
        },
        "records": [
            {
                "source_ip": "5.6.7.8",
                "count": 3,
                "disposition": "none",
                "dkim": "pass",
                "spf": "pass",
            }
        ],
    })

    response = client.delete("/api/reports?domain=example.com", headers=_auth_headers())
    assert response.status_code == 200
    assert response.json()["deleted"] == 1

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM reports WHERE id = ?", (report_id,))
    assert c.fetchone()[0] == 0
    c.execute("SELECT COUNT(*) FROM records WHERE report_id = ?", (report_id,))
    assert c.fetchone()[0] == 0
    c.execute("SELECT COUNT(*) FROM reports WHERE id = ?", (other_report_id,))
    assert c.fetchone()[0] == 1
    conn.close()
