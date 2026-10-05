from typing import List
from fastapi import APIRouter
from backend.schemas import MatchCandidateRequest, CandidateMatchResult
from backend.services.matching_service import matching_service

router = APIRouter(prefix="/matching", tags=["AI Candidate Matching"])

@router.post("/candidates", response_model=List[CandidateMatchResult])
def match_candidates_for_project(req: MatchCandidateRequest):
    """Match candidates against project domain, skill prerequisites, and reputation credits"""
    return matching_service.match_candidates(req)
