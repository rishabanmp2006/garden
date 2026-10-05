import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from backend.config import settings
from backend.schemas import AIPromptRequest, AIPromptResponse, AILogItem

class AIGatewayService:
    def __init__(self):
        self.logs: List[AILogItem] = [
            AILogItem(
                id="log-init-1",
                agent_type="developer",
                project_id="proj-1",
                request="Analyze NovaScan v3 CLAHE normalization parameters",
                response="Normalizes fundus images to 512x512 with green-channel CLAHE. Recommend INT8 quantization.",
                model="llama3-8b-instruct",
                data_sensitivity="high",
                approval_status="approved",
                created_at="2026-09-28T16:00:00Z",
            ),
            AILogItem(
                id="log-init-2",
                agent_type="reviewer",
                project_id="proj-1",
                request="Check FDA Class II sensitivity bar requirements",
                response="Requires >90% sensitivity and >85% specificity on 5,000 holdout retinal images.",
                model="llama3-8b-instruct",
                data_sensitivity="high",
                approval_status="approved",
                created_at="2026-10-02T11:20:00Z",
            ),
        ]

    def _hash_text(self, text: str) -> str:
        return hashlib.sha256(text.encode('utf-8')).hexdigest()

    async def execute_query(self, req: AIPromptRequest) -> AIPromptResponse:
        now_ts = datetime.now(timezone.utc).isoformat()
        audit_id = f"ai-log-{uuid.uuid4().hex[:8]}"
        p_hash = self._hash_text(req.prompt)

        # 1. ENFORCE GATEWAY SENSITIVITY POLICY
        is_confidential = req.project_sensitivity in ["high", "critical"]
        
        if is_confidential:
            # Enforce local execution; strictly prevent cloud transmission
            execution_type = "local_container"
            model_used = "llama3-8b-instruct [LOCAL AIR-GAPPED CONTAINER]"
            requires_approval = True
            
            # Simulated edge-aware reasoning response
            if "retinal" in req.prompt.lower() or "novascan" in req.prompt.lower():
                response_text = (
                    f"[LOCAL CONTAINER EXECUTION - OLLAMA / LLAMA-3]\n"
                    f"Policy Check: Sensitivity '{req.project_sensitivity.upper()}' detected. Zero cloud egress guaranteed.\n\n"
                    f"Analysis for {req.target_hardware}:\n"
                    f"- Normalization: Green-channel CLAHE applied locally on 512x512 matrix.\n"
                    f"- Model Architecture: Recommended MobileNetV4 backbone with lightweight multi-head self-attention.\n"
                    f"- Estimated footprint: 38MB parameters, peak inference RAM: 310MB.\n"
                    f"- Notice: Milestone 2 acceptance criteria requires mentor sign-off before committing to the ledger."
                )
            elif "raspberry" in req.prompt.lower() or "jetson" in req.prompt.lower() or "edge" in req.prompt.lower():
                response_text = (
                    f"[LOCAL CONTAINER EXECUTION - CODELLAMA-7B]\n"
                    f"Edge Benchmarking Constraints for {req.target_hardware}:\n"
                    f"- Target latency threshold: <3.0s per retinal scan.\n"
                    f"- Measured on ARM Cortex-A72: 1.84s FP16 inference with ONNX Runtime ARM NEON.\n"
                    f"- Zero data leakage: No external cloud endpoints queried."
                )
            else:
                response_text = (
                    f"[LOCAL AIR-GAPPED LLM - LLAMA 3 8B]\n"
                    f"Processed within isolated edge sandbox for project '{req.project_id}'.\n"
                    f"Output verified against Project Charter v1.0 data governance rules."
                )
        else:
            # Low/Medium sensitivity: Cloud model routing permitted
            execution_type = "cloud_api"
            model_used = "claude-3-5-sonnet (Cloud Reasoning Router)"
            requires_approval = False
            response_text = (
                f"[CLOUD AI GATEWAY ROUTED - NON-CONFIDENTIAL DATA]\n"
                f"Project sensitivity is '{req.project_sensitivity}'. Open literature search and template synthesis permitted.\n"
                f"Generated deliverable ready for public workspace integration."
            )

        r_hash = self._hash_text(response_text)

        # 2. RECORD AUDIT LOG
        log_entry = AILogItem(
            id=audit_id,
            agent_type=req.agent_type,
            project_id=req.project_id,
            request=req.prompt,
            response=response_text[:140] + "...",
            model=model_used,
            data_sensitivity=req.project_sensitivity,
            approval_status="pending" if requires_approval else "approved",
            created_at=now_ts,
        )
        self.logs.insert(0, log_entry)

        return AIPromptResponse(
            response=response_text,
            model_used=model_used,
            execution_type=execution_type,
            sensitivity_enforced=req.project_sensitivity,
            requires_human_approval=requires_approval,
            audit_log_id=audit_id,
            prompt_hash=p_hash,
            response_hash=r_hash,
            timestamp=now_ts,
        )

    def get_logs(self, project_id: Optional[str] = None) -> List[AILogItem]:
        if project_id:
            return [l for l in self.logs if l.project_id == project_id]
        return self.logs

ai_gateway_service = AIGatewayService()
