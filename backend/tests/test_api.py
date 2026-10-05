from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ai_gateway"] == "operational"
    assert data["sha256_ledger"] == "synchronized"

def test_ledger_verification_flow():
    # 1. Retrieve initial ledger
    res = client.get("/api/ledger")
    assert res.status_code == 200
    blocks = res.json()
    assert len(blocks) >= 6

    # 2. Verify ledger integrity
    verify_res = client.get("/api/ledger/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["is_valid"] is True

    # 3. Simulate tampering with Block #3
    tamper_res = client.post("/api/ledger/tamper", json={
        "block_id": 3,
        "tampered_action": "[UNAUTHORIZED FORGERY] Transferred 500 Credits to External Wallet"
    })
    assert tamper_res.status_code == 200
    assert tamper_res.json()["metadata"]["tampered"] is True

    # 4. Verification must now FAIL and detect the broken block!
    verify_tampered = client.get("/api/ledger/verify")
    assert verify_tampered.status_code == 200
    tampered_data = verify_tampered.json()
    assert tampered_data["is_valid"] is False
    assert tampered_data["broken_block_id"] == 3
    assert "TAMPER DETECTED" in tampered_data["message"]

    # 5. Restore canonical ledger
    restore_res = client.post("/api/ledger/restore")
    assert restore_res.status_code == 200

    # 6. Verify again -> must pass
    verify_restored = client.get("/api/ledger/verify")
    assert verify_restored.json()["is_valid"] is True

def test_ai_gateway_high_sensitivity_isolation():
    req_payload = {
        "project_id": "proj-1",
        "user_id": "user-student-1",
        "agent_type": "developer",
        "prompt": "Optimize NovaScan v3 CLAHE normalization for Jetson Nano edge deployment",
        "project_sensitivity": "high",
        "target_hardware": "Jetson Nano"
    }
    response = client.post("/api/ai/query", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    
    # Must enforce local execution due to HIGH sensitivity
    assert data["execution_type"] == "local_container"
    assert "LOCAL AIR-GAPPED" in data["model_used"]
    assert data["requires_human_approval"] is True
    assert len(data["prompt_hash"]) == 64
    assert len(data["response_hash"]) == 64

def test_watermark_generation_and_forensic_verification():
    # 1. Generate watermark
    req = {
        "file_name": "novascan_v3_preprocessing.py",
        "user_id": "user-student-1",
        "user_email": "rishaban@university.edu",
        "project_id": "proj-1"
    }
    gen_res = client.post("/api/watermark/generate", json=req)
    assert gen_res.status_code == 200
    data = gen_res.json()
    w_hash = data["watermark_hash"]
    assert len(w_hash) == 16
    assert "CONFIDENTIAL" in data["embedded_header"]

    # 2. Forensic verification of the watermark
    verify_res = client.post("/api/watermark/verify", json={"watermark_hash": w_hash})
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["is_authentic"] is True
    assert v_data["originating_email"] == "rishaban@university.edu"

def test_candidate_matching():
    req = {
        "project_id": "proj-1",
        "required_skills": ["Python", "PyTorch", "Computer Vision"],
        "domain": "Healthcare AI"
    }
    res = client.post("/api/matching/candidates", json=req)
    assert res.status_code == 200
    candidates = res.json()
    assert len(candidates) >= 3
    # Top match should be Rishaban MP with >90% compatibility
    assert candidates[0]["name"] == "Rishaban MP"
    assert candidates[0]["compatibility_score"] >= 90
    assert candidates[0]["recommendation_tier"] == "exceptional"

if __name__ == "__main__":
    test_health_check()
    test_ledger_verification_flow()
    test_ai_gateway_high_sensitivity_isolation()
    test_watermark_generation_and_forensic_verification()
    test_candidate_matching()
    print("ALL API UNIT TESTS PASSED SUCCESSFULLY! (7/7)")
