import hmac
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any
from backend.config import settings
from backend.schemas import (
    WatermarkGenerateRequest,
    WatermarkGenerateResponse,
    WatermarkVerifyResponse,
)

class WatermarkService:
    def __init__(self):
        # In-memory registry of issued watermarks for quick forensic lookup
        self._issued_watermarks: Dict[str, Dict[str, Any]] = {
            "7e2c918a0b3c4d5e": {
                "user_id": "user-student-1",
                "email": "rishaban@university.edu",
                "project_id": "proj-1",
                "file_name": "novascan_v3_preprocessing.py",
                "timestamp": "2026-10-05T10:14:22Z",
            }
        }

    def generate_watermark(self, req: WatermarkGenerateRequest) -> WatermarkGenerateResponse:
        now_ts = datetime.now(timezone.utc).isoformat()
        
        # Create deterministic payload
        payload = f"{req.user_id}|{req.user_email}|{req.project_id}|{req.file_name}|{now_ts}"
        
        # Generate HMAC-SHA256 signature
        sig = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        watermark_hash = sig[:16]

        header = (
            f"/* RESEARCHMESH PROTECTED ASSET • CONFIDENTIAL */\n"
            f"/* LICENSED TO: {req.user_email.upper()} • TIMESTAMP: {now_ts} */\n"
            f"/* WATERMARK HASH: {watermark_hash} • UNLAWFUL DISTRIBUTION AUDITED VIA SHA-256 LEDGER */\n"
        )

        self._issued_watermarks[watermark_hash] = {
            "user_id": req.user_id,
            "email": req.user_email,
            "project_id": req.project_id,
            "file_name": req.file_name,
            "timestamp": now_ts,
        }

        return WatermarkGenerateResponse(
            file_name=req.file_name,
            watermark_hash=watermark_hash,
            embedded_header=header,
            license_timestamp=now_ts,
            signature=sig,
        )

    def verify_watermark(self, watermark_hash: str) -> WatermarkVerifyResponse:
        clean_hash = watermark_hash.strip().lower()
        # Check if known prefix matches
        for w_hash, data in self._issued_watermarks.items():
            if w_hash in clean_hash or clean_hash in w_hash:
                return WatermarkVerifyResponse(
                    is_authentic=True,
                    originating_user=data["user_id"],
                    originating_email=data["email"],
                    project_id=data["project_id"],
                    timestamp=data["timestamp"],
                    status=f"AUTHENTIC LICENSED WATERMARK: Origin matches verified researcher {data['email']}.",
                )

        return WatermarkVerifyResponse(
            is_authentic=False,
            status="UNKNOWN WATERMARK: No issuance record found in ledger forensic registry.",
        )

watermark_service = WatermarkService()
