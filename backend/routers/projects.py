from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["Research Projects"])

class ProjectSummary(BaseModel):
    id: str
    title: str
    domain: str
    sensitivity_level: str
    engagement_model: str
    budget: float
    duration_days: int
    public_summary: str
    status: str

DEMO_PROJECTS_DATA = [
    {
        "id": "proj-1",
        "title": "Low-cost Diabetic Retinopathy Detection on Edge Devices",
        "domain": "Healthcare AI",
        "sensitivity_level": "high",
        "engagement_model": "funded",
        "budget": 100000.0,
        "duration_days": 180,
        "public_summary": "Develop a lightweight deep learning model for diabetic retinopathy screening on edge hardware (Jetson Nano, RPi4).",
        "status": "active",
    },
    {
        "id": "proj-2",
        "title": "Open Research Toolkit for Accessible STEM Education",
        "domain": "Education Technology",
        "sensitivity_level": "low",
        "engagement_model": "knowledge_sharing",
        "budget": 0.0,
        "duration_days": 120,
        "public_summary": "Build an open-source toolkit of interactive STEM learning modules with multilingual support.",
        "status": "open",
    },
]

@router.get("", response_model=List[ProjectSummary])
def list_projects():
    """List all public research problem statements"""
    return DEMO_PROJECTS_DATA

@router.get("/{project_id}", response_model=ProjectSummary)
def get_project(project_id: str):
    """Get project by ID"""
    for p in DEMO_PROJECTS_DATA:
        if p["id"] == project_id:
            return p
    raise HTTPException(status_code=404, detail="Project not found")
