from fastapi import APIRouter
from backend.schemas import (
    WatermarkGenerateRequest,
    WatermarkGenerateResponse,
    WatermarkVerifyRequest,
    WatermarkVerifyResponse,
)
from backend.services.watermark_service import watermark_service

router = APIRouter(prefix="/watermark", tags=["Cryptographic Watermarking"])

@router.post("/generate", response_model=WatermarkGenerateResponse)
def generate_watermark(req: WatermarkGenerateRequest):
    """Generate dynamic cryptographic watermark for sensitive file download"""
    return watermark_service.generate_watermark(req)

@router.post("/verify", response_model=WatermarkVerifyResponse)
def verify_watermark(req: WatermarkVerifyRequest):
    """Forensically inspect an extracted watermark hash to discover origin licensee"""
    return watermark_service.verify_watermark(req.watermark_hash)
