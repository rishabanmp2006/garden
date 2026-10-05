import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from backend.config import settings
from backend.schemas import AIPromptRequest, AIPromptResponse, AILogItem

from backend.database import get_db

class AIGatewayService:
    def __init__(self):
        self.logs: List[AILogItem] = []

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

        # 2. RECORD AUDIT LOG TO DATABASE
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO ai_activity_logs (
                id, project_id, human_owner_id, agent_type, request, response,
                model, data_sensitivity, approval_status, prompt_hash, response_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                audit_id, req.project_id, req.human_owner_id or "anonymous", req.agent_type,
                req.prompt, response_text[:200] + "...", model_used, req.project_sensitivity,
                "pending" if requires_approval else "approved", p_hash, r_hash, now_ts
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error persisting AI log to database: {e}")

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
        try:
            conn = get_db()
            cursor = conn.cursor()
            if project_id:
                cursor.execute("SELECT * FROM ai_activity_logs WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
            else:
                cursor.execute("SELECT * FROM ai_activity_logs ORDER BY created_at DESC")
            rows = cursor.fetchall()
            conn.close()
            db_logs = [
                AILogItem(
                    id=r["id"],
                    agent_type=r["agent_type"],
                    project_id=r["project_id"] or "",
                    request=r["request"],
                    response=r["response"],
                    model=r["model"],
                    data_sensitivity=r["data_sensitivity"],
                    approval_status=r["approval_status"],
                    created_at=r["created_at"],
                )
                for r in rows
            ]
            return db_logs
        except Exception as e:
            return self.logs

ai_gateway_service = AIGatewayService()
