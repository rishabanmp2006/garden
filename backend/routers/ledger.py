from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from backend.schemas import LedgerBlock, LedgerVerifyResponse, TamperBlockRequest
from backend.services.ledger_service import ledger_service

router = APIRouter(prefix="/ledger", tags=["SHA-256 Provenance Ledger"])

class RecordLedgerEntryRequest(BaseModel):
    project_id: str
    actor_id: str
    action: str
    content_payload: str
    metadata: Optional[Dict[str, Any]] = None

@router.get("", response_model=List[LedgerBlock])
def get_ledger(project_id: Optional[str] = None):
    """Retrieve verified SHA-256 blocks for a project or entire system"""
    return ledger_service.get_blocks(project_id=project_id)

@router.post("/record", response_model=LedgerBlock)
def record_ledger_entry(req: RecordLedgerEntryRequest):
    """Append a new cryptographic provenance block to the SHA-256 hash chain"""
    return ledger_service.append_entry(
        project_id=req.project_id,
        actor_id=req.actor_id,
        actor_type="human",
        action=req.action,
        content_payload=req.content_payload,
        metadata=req.metadata or {}
    )

@router.get("/verify", response_model=LedgerVerifyResponse)
def verify_ledger():
    """Sequentially recalculate all SHA-256 block hashes to audit ledger integrity"""
    return ledger_service.verify_integrity()

@router.post("/tamper", response_model=LedgerBlock)
def simulate_tamper(req: TamperBlockRequest):
    """Simulate an unauthorized block modification to demonstrate tamper detection"""
    try:
        return ledger_service.simulate_tampering(req.block_id, req.tampered_action)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/restore")
def restore_canonical_ledger():
    """Restore canonical untampered ledger"""
    ledger_service.restore_canonical()
    return {"status": "success", "message": "Canonical ledger state restored."}

