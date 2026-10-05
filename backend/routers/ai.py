from typing import List, Optional
from fastapi import APIRouter
from backend.schemas import AIPromptRequest, AIPromptResponse, AILogItem
from backend.services.ai_gateway import ai_gateway_service

router = APIRouter(prefix="/ai", tags=["AI Policy Gateway"])

@router.post("/query", response_model=AIPromptResponse)
async def query_ai_gateway(req: AIPromptRequest):
    """Execute research prompt through the AI Policy Gateway with air-gap checks"""
    return await ai_gateway_service.execute_query(req)

@router.get("/logs", response_model=List[AILogItem])
def get_ai_logs(project_id: Optional[str] = None):
    """Retrieve traceable AI activity audit logs"""
    return ai_gateway_service.get_logs(project_id=project_id)
