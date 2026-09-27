import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_status_endpoint():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "TransmuteAI"
    assert "ledger_intact" in data
    assert data["ledger_intact"] is True

def test_api_generate_brief_mock():
    payload = {
        "title": "Quantum Compute Resiliency",
        "raw_text": "Quantum compute introduces novel cryptographic challenges. Enterprise architectures must prepare for post-quantum signatures and lattice-based algorithms.",
        "tone": "authoritative",
        "provider": "mock"
    }
    response = client.post("/api/brief/generate", json=payload)
    assert response.status_code == 200
    brief = response.json()
    assert brief["title"] == "Quantum Compute Resiliency"
    assert "brief_id" in brief
    assert len(brief["presentation_outline"]) >= 2

def test_api_transform_and_verify_flow():
    # 1. Generate brief
    payload = {
        "title": "Integration Pipeline Test",
        "raw_text": "Automated multi-format transformation with cryptographic provenance ledger tracking.",
        "tone": "professional",
        "provider": "mock"
    }
    brief_resp = client.post("/api/brief/generate", json=payload)
    assert brief_resp.status_code == 200
    brief = brief_resp.json()

    # 2. Trigger transformation
    transform_resp = client.post("/api/transform", json={"brief": brief, "formats": ["docx", "pptx", "social"]})
    assert transform_resp.status_code == 200
    task_info = transform_resp.json()
    task_id = task_info["task_id"]

    # 3. Check task status
    task_status_resp = client.get(f"/api/tasks/{task_id}")
    assert task_status_resp.status_code == 200
    status_data = task_status_resp.json()
    assert status_data["status"] in ["PENDING", "PROCESSING", "COMPLETED"]

    # 4. Provenance audit
    audit_resp = client.get("/api/provenance/chain/audit")
    assert audit_resp.status_code == 200
    audit = audit_resp.json()
    assert audit["is_valid"] is True
