from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# ---- Sensitivity & Enums ----
SensitivityLevel = Literal["low", "medium", "high", "critical"]
AgentType = Literal["research", "developer", "reviewer"]
ApprovalStatus = Literal["pending", "approved", "rejected"]

# ---- AI Gateway Schemas ----
class AIPromptRequest(BaseModel):
    project_id: str
    user_id: str
    agent_type: AgentType = "developer"
    prompt: str
    project_sensitivity: SensitivityLevel = "high"
    target_hardware: Optional[str] = "Jetson Nano / Raspberry Pi 4"

class AIPromptResponse(BaseModel):
    response: str
    model_used: str
    execution_type: Literal["local_container", "cloud_api", "policy_blocked"]
    sensitivity_enforced: SensitivityLevel
    requires_human_approval: bool
    audit_log_id: str
    prompt_hash: str
    response_hash: str
    timestamp: str

class AILogItem(BaseModel):
    id: str
    agent_type: str
    project_id: str
    request: str
    response: str
    model: str
    data_sensitivity: str
    approval_status: str
    created_at: str

# ---- Ledger Schemas ----
class LedgerBlock(BaseModel):
    id: int
    project_id: str
    actor_id: str
    actor_type: Literal["human", "ai_agent"]
    action: str
    content_hash: str
    previous_hash: str
    entry_hash: str
    timestamp: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class LedgerVerifyResponse(BaseModel):
    is_valid: bool
    total_blocks_verified: int
    genesis_hash: str
    terminal_hash: str
    broken_block_id: Optional[int] = None
    message: str

class TamperBlockRequest(BaseModel):
    block_id: int
    tampered_action: str

# ---- Watermarking Schemas ----
class WatermarkGenerateRequest(BaseModel):
    file_name: str
    user_id: str
    user_email: str
    project_id: str

class WatermarkGenerateResponse(BaseModel):
    file_name: str
    watermark_hash: str
    embedded_header: str
    license_timestamp: str
    signature: str

class WatermarkVerifyRequest(BaseModel):
    watermark_hash: str

class WatermarkVerifyResponse(BaseModel):
    is_authentic: bool
    originating_user: Optional[str] = None
    originating_email: Optional[str] = None
    project_id: Optional[str] = None
    timestamp: Optional[str] = None
    status: str

# ---- Matching Schemas ----
class MatchCandidateRequest(BaseModel):
    project_id: str
    required_skills: List[str]
    domain: str

class CandidateMatchResult(BaseModel):
    user_id: str
    name: str
    compatibility_score: int
    match_reasons: List[str]
    verified_credits: int
    recommendation_tier: Literal["exceptional", "strong", "qualified"]
