import uuid
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from backend.database import get_db
from backend.services.ledger_service import ledger_service

router = APIRouter(prefix="/projects", tags=["Research Projects & Workspace Lifecycle"])

# Schemas
class CreateProjectPayload(BaseModel):
    org_id: str
    org_name: Optional[str] = "Organization"
    title: str
    public_summary: str
    confidential_brief: str
    domain: str
    required_skills: List[str]
    sensitivity_level: str = "high"
    engagement_model: str = "funded"
    budget: float = 50000.0
    withdrawal_threshold: float = 50.0
    duration_days: int = 120
    ai_policy: Dict[str, Any] = Field(default_factory=dict)
    ip_ownership: str = "Shared IP — Organization retains proprietary assets; contributors retain novel algorithms with license-back"
    authorship_rules: str = "Co-authorship for contributors exceeding >15% verified credits"
    commercialization_terms: Optional[str] = "Non-commercial open research"
    public_files: List[Any] = Field(default_factory=list)
    confidential_files: List[Any] = Field(default_factory=list)

class ApplyPayload(BaseModel):
    user_id: str
    role: str = "student"
    message: str
    relevant_skills: List[str] = Field(default_factory=list)

class CreateTaskPayload(BaseModel):
    milestone_id: str
    title: str
    description: str
    credits_reward: int = 25

class SubmitWorkPayload(BaseModel):
    task_id: str
    contributor_id: str
    file_name: str
    file_content: Optional[str] = None
    code_content: Optional[str] = None
    description: str
    ai_involvement: str = "none"

class ReviewWorkPayload(BaseModel):
    reviewer_id: str
    verdict: Optional[str] = None
    outcome: Optional[str] = None
    comment: str

class RequestWithdrawalPayload(BaseModel):
    student_id: str
    amount: Optional[float] = None
    credits_amount: Optional[int] = None
    credits_exchanged: Optional[int] = None
    payout_profile: Optional[Dict[str, Any]] = None
    account_holder: Optional[str] = "Student Contributor"
    masked_account: Optional[str] = "••••4829"
    demo_ifsc: Optional[str] = "HDFC0001234"

class ReviewWithdrawalPayload(BaseModel):
    reviewer_id: str
    action: str  # approve or reject
    rejection_reason: Optional[str] = None

class SubmitRatingPayload(BaseModel):
    rater_id: str
    rated_id: str
    technical: int
    collaboration: int
    timeline: int
    charter_integrity: int
    comment: str

# 1. CREATE PROJECT
@router.post("")
@router.post("/create")
def create_project(payload: CreateProjectPayload):
    conn = get_db()
    cursor = conn.cursor()
    
    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    now_ts = datetime.now(timezone.utc).isoformat()

    # Insert Project
    cursor.execute("""
    INSERT INTO projects (
        id, org_id, title, public_summary, confidential_brief, domain,
        required_skills, sensitivity_level, engagement_model, budget,
        withdrawal_threshold, ai_policy, ip_ownership, authorship_rules,
        commercialization_terms, duration_days, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    """, (
        project_id, payload.org_id, payload.title, payload.public_summary,
        payload.confidential_brief, payload.domain, json.dumps(payload.required_skills),
        payload.sensitivity_level, payload.engagement_model, payload.budget,
        payload.withdrawal_threshold, json.dumps(payload.ai_policy), payload.ip_ownership,
        payload.authorship_rules, payload.commercialization_terms, payload.duration_days,
        now_ts, now_ts
    ))

    # Add Org as project member
    cursor.execute("""
    INSERT INTO project_members (id, project_id, user_id, role, status, joined_at)
    VALUES (?, ?, ?, 'organization_owner', 'active', ?)
    """, (f"mem-{uuid.uuid4().hex[:8]}", project_id, payload.org_id, now_ts))

    # Create Charter v1.0
    charter_id = f"charter-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO charters (
        id, project_id, version, title, scope, ip_terms, authorship_terms,
        confidentiality_terms, ai_policy_terms, dispute_rules, withdrawal_rules, status, created_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    """, (
        charter_id, project_id, f"Research Charter v1.0 — {payload.title}",
        payload.public_summary, payload.ip_ownership, payload.authorship_rules,
        "Confidential assets restricted to signatories. Violations recorded on ledger.",
        json.dumps(payload.ai_policy), "Disputes adjudicated by Mentor & Council.",
        f"Withdrawal threshold set at {payload.withdrawal_threshold} credits.", now_ts
    ))

    # Sign Charter for Org Owner
    cursor.execute("""
    INSERT INTO charter_acceptances (id, charter_id, user_id, accepted_at)
    VALUES (?, ?, ?, ?)
    """, (f"ca-{uuid.uuid4().hex[:8]}", charter_id, payload.org_id, now_ts))

    # Initialize Escrow Account
    cursor.execute("""
    INSERT INTO escrow_accounts (id, project_id, total_budget, available_balance, released_balance, status, updated_at)
    VALUES (?, ?, ?, ?, 0, 'funded', ?)
    """, (f"escrow-{uuid.uuid4().hex[:8]}", project_id, payload.budget, payload.budget, now_ts))

    # Insert default Milestone 1
    m1_id = f"ms-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
    INSERT INTO milestones (id, project_id, title, description, deliverables, acceptance_criteria, budget_allocation, due_date, status, created_at)
    VALUES (?, ?, 'Milestone 1: Data Pipeline & Environment Setup', 'Setup repository, data normalization, and containerized runtime.', ?, 'Pipeline passes unit tests with <2% data loss', ?, ?, 'in_progress', ?)
    """, (
        m1_id, project_id, json.dumps(["Preprocessing code", "Validation tests"]),
        payload.budget * 0.3, now_ts, now_ts
    ))

    # Insert files if provided
    for f in payload.public_files:
        fname = f["name"] if isinstance(f, dict) else str(f)
        fsize = f.get("size", "45 KB") if isinstance(f, dict) else "45 KB"
        cursor.execute("""
        INSERT INTO files (id, project_id, name, storage_path, file_size, is_confidential, sensitivity_level, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, 0, 'low', ?, ?)
        """, (f"file-{uuid.uuid4().hex[:8]}", project_id, fname, f"/storage/public/{fname}", fsize, payload.org_id, now_ts))

    for f in payload.confidential_files:
        fname = f["name"] if isinstance(f, dict) else str(f)
        fsize = f.get("size", "2.8 MB") if isinstance(f, dict) else "2.8 MB"
        cursor.execute("""
        INSERT INTO files (id, project_id, name, storage_path, file_size, is_confidential, sensitivity_level, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 'high', ?, ?)
        """, (f"file-{uuid.uuid4().hex[:8]}", project_id, fname, f"/storage/confidential/{fname}", fsize, payload.org_id, now_ts))

    conn.commit()
    conn.close()

    # Log to persistent SHA-256 Ledger
    ledger_service.append_entry(
        project_id=project_id,
        actor_id=payload.org_id,
        actor_type="human",
        action=f"Created Research Project: '{payload.title}' & Published Charter v1.0",
        content_payload=f"{project_id}|{payload.title}|{payload.budget}|{now_ts}",
        metadata={"budget": payload.budget, "threshold": payload.withdrawal_threshold}
    )

    return {"project_id": project_id, "status": "success", "message": "Project published and recorded on ledger."}

# 2. LIST PROJECTS
@router.get("")
def list_projects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    
    projects = []
    for r in rows:
        # Get member count
        cursor.execute("SELECT COUNT(*) as count FROM project_members WHERE project_id = ?", (r["id"],))
        m_count = cursor.fetchone()["count"]

        # Get org profile
        cursor.execute("SELECT display_name, org_name, verified FROM profiles WHERE id = ?", (r["org_id"],))
        org_row = cursor.fetchone()

        projects.append({
            "id": r["id"],
            "org_id": r["org_id"],
            "org_name": org_row["org_name"] if org_row else "Organization",
            "org_verified": bool(org_row["verified"]) if org_row else False,
            "title": r["title"],
            "public_summary": r["public_summary"],
            "domain": r["domain"],
            "required_skills": json.loads(r["required_skills"]) if r["required_skills"] else [],
            "sensitivity_level": r["sensitivity_level"],
            "engagement_model": r["engagement_model"],
            "budget": r["budget"],
            "withdrawal_threshold": r["withdrawal_threshold"],
            "duration_days": r["duration_days"],
            "status": r["status"],
            "member_count": m_count,
            "created_at": r["created_at"],
        })
    conn.close()
    return projects

# 3. GET SINGLE PROJECT DETAILS
@router.get("/{project_id}")
def get_project_details(project_id: str, user_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    p = cursor.fetchone()
    if not p:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    # Check membership & charter acceptance
    is_member = False
    has_accepted_charter = False
    user_role = None

    if user_id:
        cursor.execute("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?", (project_id, user_id))
        mem_row = cursor.fetchone()
        if mem_row:
            is_member = True
            user_role = mem_row["role"]

        cursor.execute("""
        SELECT ca.id FROM charter_acceptances ca
        JOIN charters c ON c.id = ca.charter_id
        WHERE c.project_id = ? AND ca.user_id = ? AND c.status = 'active'
        """, (project_id, user_id))
        if cursor.fetchone():
            has_accepted_charter = True

    # Members
    cursor.execute("""
    SELECT pm.role, pm.joined_at, pr.id as user_id, pr.display_name, pr.email, pr.education, pr.skills
    FROM project_members pm
    JOIN profiles pr ON pr.id = pm.user_id
    WHERE pm.project_id = ?
    """, (project_id,))
    members = [dict(r) for r in cursor.fetchall()]

    # Milestones
    cursor.execute("SELECT * FROM milestones WHERE project_id = ? ORDER BY created_at ASC", (project_id,))
    milestones = [dict(r) for r in cursor.fetchall()]

    # Tasks
    cursor.execute("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC", (project_id,))
    tasks = [dict(r) for r in cursor.fetchall()]

    # Files (Confidential files locked unless member who accepted charter!)
    cursor.execute("SELECT * FROM files WHERE project_id = ?", (project_id,))
    raw_files = cursor.fetchall()
    files = []
    can_view_confidential = is_member and has_accepted_charter
    for f in raw_files:
        if f["is_confidential"] and not can_view_confidential:
            continue
        files.append(dict(f))

    # Active Charter
    cursor.execute("SELECT * FROM charters WHERE project_id = ? AND status = 'active'", (project_id,))
    charter_row = cursor.fetchone()
    charter = dict(charter_row) if charter_row else None

    # Escrow
    cursor.execute("SELECT * FROM escrow_accounts WHERE project_id = ?", (project_id,))
    escrow_row = cursor.fetchone()
    escrow = dict(escrow_row) if escrow_row else None

    conn.close()

    return {
        "project": {
            "id": p["id"],
            "org_id": p["org_id"],
            "title": p["title"],
            "public_summary": p["public_summary"],
            "confidential_brief": p["confidential_brief"] if can_view_confidential else None,
            "is_confidential_locked": not can_view_confidential,
            "domain": p["domain"],
            "required_skills": json.loads(p["required_skills"]) if p["required_skills"] else [],
            "sensitivity_level": p["sensitivity_level"],
            "engagement_model": p["engagement_model"],
            "budget": p["budget"],
            "withdrawal_threshold": p["withdrawal_threshold"],
            "ai_policy": json.loads(p["ai_policy"]) if p["ai_policy"] else {},
            "ip_ownership": p["ip_ownership"],
            "authorship_rules": p["authorship_rules"],
            "duration_days": p["duration_days"],
            "status": p["status"],
            "created_at": p["created_at"],
        },
        "is_member": is_member,
        "user_role": user_role,
        "has_accepted_charter": has_accepted_charter,
        "members": members,
        "milestones": milestones,
        "tasks": tasks,
        "files": files,
        "charter": charter,
        "escrow": escrow,
    }

# 4. APPLY TO PROJECT
@router.post("/{project_id}/apply")
def apply_to_project(project_id: str, payload: ApplyPayload):
    conn = get_db()
    cursor = conn.cursor()

    # Get student profile for match calculation
    cursor.execute("SELECT * FROM profiles WHERE id = ?", (payload.user_id,))
    prof = cursor.fetchone()
    if not prof:
        conn.close()
        raise HTTPException(status_code=404, detail="Student profile not found")

    cursor.execute("SELECT required_skills, domain FROM projects WHERE id = ?", (project_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    # Real reproducible match calculation
    req_skills = json.loads(proj["required_skills"]) if proj["required_skills"] else []
    student_skills = json.loads(prof["skills"]) if prof["skills"] else []

    req_set = {s.lower() for s in req_skills}
    stu_set = {s.lower() for s in student_skills}
    common = req_set.intersection(stu_set)

    skill_score = (len(common) / max(len(req_set), 1)) * 60
    domain_score = 25 if proj["domain"].lower() in prof["domains"].lower() else 10
    match_score = min(int(skill_score + domain_score + 10), 98)

    reasons = []
    if common:
        reasons.append(f"Matched skills: {', '.join(s.title() for s in common)}")
    if proj["domain"].lower() in prof["domains"].lower():
        reasons.append(f"Domain match in {proj['domain']}")
    reasons.append(f"Availability: {prof['availability'] or 'Flexible'}")

    now_ts = datetime.now(timezone.utc).isoformat()
    app_id = f"app-{uuid.uuid4().hex[:8]}"

    try:
        cursor.execute("""
        INSERT INTO applications (id, project_id, user_id, role, message, relevant_skills, match_score, match_reasons, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        """, (
            app_id, project_id, payload.user_id, payload.role, payload.message,
            json.dumps(student_skills), match_score, json.dumps(reasons), now_ts
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail="Application already submitted or error occurred.")

    conn.close()
    return {"application_id": app_id, "match_score": match_score, "match_reasons": reasons, "status": "pending"}

# 5. ACCEPT APPLICANT INTO PROJECT (Team Formation)
@router.post("/applications/{application_id}/accept")
def accept_applicant(application_id: str, reviewer_id: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM applications WHERE id = ?", (application_id,))
    app = cursor.fetchone()
    if not app:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")

    now_ts = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE applications SET status = 'accepted', reviewed_by = ?, reviewed_at = ? WHERE id = ?",
                   (reviewer_id, now_ts, application_id))

    # Add to project_members
    cursor.execute("""
    INSERT INTO project_members (id, project_id, user_id, role, status, joined_at)
    VALUES (?, ?, ?, ?, 'active', ?)
    ON CONFLICT(project_id, user_id) DO UPDATE SET status = 'active'
    """, (f"mem-{uuid.uuid4().hex[:8]}", app["project_id"], app["user_id"], app["role"], now_ts))

    conn.commit()
    conn.close()

    # Log to ledger
    ledger_service.append_entry(
        project_id=app["project_id"],
        actor_id=reviewer_id,
        actor_type="human",
        action=f"Admitted {app['role'].title()} to Project Team (App ID: {application_id})",
        content_payload=f"{application_id}|{app['user_id']}|{now_ts}"
    )

    return {"status": "success", "message": "Applicant accepted into project workspace."}

# 5.1 ADD PROJECT MEMBER (Direct Join / Mentor Assignment)
class AddMemberPayload(BaseModel):
    user_id: str
    role: str = "student"

@router.post("/{project_id}/members")
def add_project_member(project_id: str, payload: AddMemberPayload):
    conn = get_db()
    cursor = conn.cursor()
    now_ts = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO project_members (id, project_id, user_id, role, status, joined_at)
    VALUES (?, ?, ?, ?, 'active', ?)
    ON CONFLICT(project_id, user_id) DO UPDATE SET status = 'active', role = ?
    """, (f"mem-{uuid.uuid4().hex[:8]}", project_id, payload.user_id, payload.role, now_ts, payload.role))
    conn.commit()
    conn.close()

    ledger_service.append_entry(
        project_id=project_id,
        actor_id=payload.user_id,
        actor_type="human",
        action=f"Joined Project as {payload.role.title()}",
        content_payload=f"{project_id}|{payload.user_id}|{payload.role}|{now_ts}"
    )

    return {"status": "success", "message": f"Added to project as {payload.role}."}

# 6. ACCEPT CHARTER
class AcceptCharterPayload(BaseModel):
    user_id: Optional[str] = None

@router.post("/{project_id}/accept-charter")
@router.post("/{project_id}/charter/accept")
def accept_project_charter(project_id: str, user_id: Optional[str] = None, payload: Optional[AcceptCharterPayload] = None):
    effective_user_id = user_id or (payload.user_id if payload else None)
    if not effective_user_id:
        raise HTTPException(status_code=400, detail="User ID is required to sign charter.")

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM charters WHERE project_id = ? AND status = 'active'", (project_id,))
    charter = cursor.fetchone()
    if not charter:
        conn.close()
        raise HTTPException(status_code=404, detail="Active charter not found")

    now_ts = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO charter_acceptances (id, charter_id, user_id, accepted_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(charter_id, user_id) DO NOTHING
    """, (f"ca-{uuid.uuid4().hex[:8]}", charter["id"], effective_user_id, now_ts))

    conn.commit()
    conn.close()

    ledger_service.append_entry(
        project_id=project_id,
        actor_id=effective_user_id,
        actor_type="human",
        action=f"Signed & Accepted Research Charter v1.0",
        content_payload=f"{charter['id']}|{effective_user_id}|{now_ts}"
    )

    return {"status": "success", "message": "Charter v1.0 signed. Confidential data room unlocked."}

# 7. CREATE INNER TASK
@router.post("/{project_id}/tasks")
def create_task(project_id: str, payload: CreateTaskPayload):
    conn = get_db()
    cursor = conn.cursor()

    now_ts = datetime.now(timezone.utc).isoformat()
    task_id = f"task-{uuid.uuid4().hex[:8]}"

    cursor.execute("""
    INSERT INTO tasks (id, milestone_id, project_id, title, description, status, credits_reward, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?)
    """, (task_id, payload.milestone_id, project_id, payload.title, payload.description, payload.credits_reward, now_ts, now_ts))

    conn.commit()
    conn.close()

    return {"task_id": task_id, "status": "todo", "message": "Task created."}

# 8. SUBMIT WORK (Contribution Upload)
@router.post("/tasks/{task_id}/submit")
@router.post("/{project_id}/contributions/submit")
def submit_task_work(payload: SubmitWorkPayload, task_id: Optional[str] = None, project_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    effective_task_id = task_id or payload.task_id
    cursor.execute("SELECT project_id, title FROM tasks WHERE id = ?", (effective_task_id,))
    t = cursor.fetchone()
    
    eff_proj_id = project_id
    if t:
        eff_proj_id = t["project_id"]
    elif not eff_proj_id:
        eff_proj_id = "default-project"

    now_ts = datetime.now(timezone.utc).isoformat()
    raw_content = payload.code_content or payload.file_content or "submitted code content"
    c_hash = hashlib.sha256(raw_content.encode('utf-8')).hexdigest()
    contrib_id = f"contrib-{uuid.uuid4().hex[:8]}"

    # Update task status to under_review
    if effective_task_id:
        cursor.execute("UPDATE tasks SET status = 'under_review', assigned_to = ?, updated_at = ? WHERE id = ?",
                       (payload.contributor_id, now_ts, effective_task_id))

    # Insert contribution record
    cursor.execute("""
    INSERT INTO contributions (
        id, project_id, task_id, contributor_id, role, type, description,
        file_name, file_url, content_hash, ai_involvement, status, created_at
    ) VALUES (?, ?, ?, ?, 'student', 'code', ?, ?, ?, ?, ?, 'under_review', ?)
    """, (
        contrib_id, eff_proj_id, effective_task_id, payload.contributor_id, payload.description,
        payload.file_name, f"/artifacts/{payload.file_name}", c_hash, payload.ai_involvement, now_ts
    ))

    conn.commit()
    conn.close()

    return {"contribution_id": contrib_id, "status": "under_review", "content_hash": c_hash}

# 9. REVIEW CONTRIBUTION & AWARD CREDITS (Mentor Approval)
@router.post("/contributions/{contrib_id}/review")
def review_contribution(contrib_id: str, payload: ReviewWorkPayload):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM contributions WHERE id = ?", (contrib_id,))
    c = cursor.fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Contribution not found")

    now_ts = datetime.now(timezone.utc).isoformat()
    verdict = (payload.verdict or payload.outcome or "approved").lower()

    if verdict == "approved":
        # Get task reward credits
        credits_to_award = 25
        if c["task_id"]:
            cursor.execute("SELECT credits_reward FROM tasks WHERE id = ?", (c["task_id"],))
            t_row = cursor.fetchone()
            if t_row and t_row["credits_reward"]:
                credits_to_award = t_row["credits_reward"]

        # 1. Update contribution
        cursor.execute("""
        UPDATE contributions SET status = 'approved', credits_awarded = ?, reviewed_by = ?, reviewed_at = ?, review_comment = ?
        WHERE id = ?
        """, (credits_to_award, payload.reviewer_id, now_ts, payload.comment, contrib_id))

        # 2. Update task to completed
        if c["task_id"]:
            cursor.execute("UPDATE tasks SET status = 'completed', updated_at = ? WHERE id = ?", (now_ts, c["task_id"]))

        # 3. Award credits
        credit_id = f"cred-{uuid.uuid4().hex[:8]}"
        cursor.execute("""
        INSERT INTO credits (id, user_id, project_id, contribution_id, task_id, amount, reason, awarded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (credit_id, c["contributor_id"], c["project_id"], contrib_id, c["task_id"],
              credits_to_award, f"Approved deliverable: {c['file_name'] or c['type']}", payload.reviewer_id, now_ts))

        conn.commit()
        conn.close()

        # 4. Append to immutable SHA-256 Ledger
        ledger_service.append_entry(
            project_id=c["project_id"],
            actor_id=payload.reviewer_id,
            actor_type="human",
            action=f"Approved Contribution & Awarded {credits_to_award} Credits to Contributor",
            content_payload=f"{contrib_id}|{c['content_hash']}|{credits_to_award}|{now_ts}",
            metadata={"credits": credits_to_award, "contribution_id": contrib_id}
        )

        return {"status": "approved", "credits_awarded": credits_to_award, "message": "Work approved and credits committed to ledger."}
    else:
        cursor.execute("UPDATE contributions SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, review_comment = ? WHERE id = ?",
                       (payload.reviewer_id, now_ts, payload.comment, contrib_id))
        if c["task_id"]:
            cursor.execute("UPDATE tasks SET status = 'rejected', updated_at = ? WHERE id = ?", (now_ts, c["task_id"]))
        conn.commit()
        conn.close()
        return {"status": "rejected", "message": "Revision requested."}

# 10. REQUEST WITHDRAWAL (When credits >= withdrawal_threshold)
@router.post("/{project_id}/withdraw")
@router.post("/{project_id}/withdrawals/request")
def request_withdrawal(project_id: str, payload: RequestWithdrawalPayload):
    conn = get_db()
    cursor = conn.cursor()

    # Check project threshold
    cursor.execute("SELECT withdrawal_threshold, budget FROM projects WHERE id = ?", (project_id,))
    proj = cursor.fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    # Calculate real student verified credits
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM credits WHERE user_id = ? AND project_id = ?",
                   (payload.student_id, project_id))
    current_credits = cursor.fetchone()["total"]

    if current_credits < proj["withdrawal_threshold"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Credit threshold not met. Current: {current_credits}, Required: {proj['withdrawal_threshold']}"
        )

    now_ts = datetime.now(timezone.utc).isoformat()
    req_id = f"wdr-{uuid.uuid4().hex[:8]}"

    credits_exchanged = payload.credits_exchanged or payload.credits_amount or current_credits
    amount_val = payload.amount if payload.amount is not None else float(credits_exchanged * 100.0)

    payout_data = payload.payout_profile or {
        "account_holder": payload.account_holder,
        "masked_account": payload.masked_account,
        "demo_ifsc": payload.demo_ifsc,
        "simulated": True
    }

    cursor.execute("""
    INSERT INTO withdrawal_requests (
        id, project_id, student_id, amount, credits_exchanged, payout_profile, status, requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    """, (req_id, project_id, payload.student_id, amount_val, credits_exchanged, json.dumps(payout_data), now_ts))

    conn.commit()
    conn.close()

    # Log to ledger
    ledger_service.append_entry(
        project_id=project_id,
        actor_id=payload.student_id,
        actor_type="human",
        action=f"Submitted Simulated Withdrawal Request for {payload.amount} USD ({payload.credits_exchanged} Credits)",
        content_payload=f"{req_id}|{payload.student_id}|{payload.amount}|{now_ts}"
    )

    return {"withdrawal_id": req_id, "status": "pending", "message": "Withdrawal request submitted for organization approval."}

# 11. APPROVE WITHDRAWAL & RELEASE SIMULATED ESCROW
@router.post("/withdrawals/{withdrawal_id}/approve")
def approve_withdrawal(withdrawal_id: str, payload: ReviewWithdrawalPayload):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM withdrawal_requests WHERE id = ?", (withdrawal_id,))
    wdr = cursor.fetchone()
    if not wdr:
        conn.close()
        raise HTTPException(status_code=404, detail="Withdrawal request not found")

    now_ts = datetime.now(timezone.utc).isoformat()

    if payload.action == "approve":
        # 1. Update withdrawal status to paid
        cursor.execute("UPDATE withdrawal_requests SET status = 'paid', reviewed_by = ?, reviewed_at = ?, paid_at = ? WHERE id = ?",
                       (payload.reviewer_id, now_ts, now_ts, withdrawal_id))

        # 2. Update escrow account (decrease available, increase released)
        cursor.execute("""
        UPDATE escrow_accounts
        SET available_balance = available_balance - ?, released_balance = released_balance + ?, updated_at = ?
        WHERE project_id = ?
        """, (wdr["amount"], wdr["amount"], now_ts, wdr["project_id"]))

        conn.commit()
        conn.close()

        # 3. Log to immutable SHA-256 Ledger
        ledger_service.append_entry(
            project_id=wdr["project_id"],
            actor_id=payload.reviewer_id,
            actor_type="human",
            action=f"Approved Simulated Payout: {wdr['amount']} USD Released from Escrow",
            content_payload=f"{withdrawal_id}|{wdr['student_id']}|{wdr['amount']}|PAID|{now_ts}"
        )

        return {
            "status": "paid",
            "amount_released": wdr["amount"],
            "amount_paid_inr": wdr["amount"],
            "message": "Simulated escrow payment released to student."
        }
    else:
        cursor.execute("UPDATE withdrawal_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, rejection_reason = ? WHERE id = ?",
                       (payload.reviewer_id, now_ts, payload.rejection_reason or "Declined", withdrawal_id))
        conn.commit()
        conn.close()
        return {"status": "rejected", "message": "Withdrawal declined."}

# 12. GET PROJECT APPLICATIONS (For Organization to review real applicants)
@router.get("/{project_id}/applications")
def get_project_applications(project_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.*, p.display_name, p.email, p.skills as student_skills, p.domains, p.education, p.experience
    FROM applications a
    JOIN profiles p ON p.id = a.user_id
    WHERE a.project_id = ?
    ORDER BY a.created_at DESC
    """, (project_id,))
    rows = cursor.fetchall()
    conn.close()
    
    apps = []
    for r in rows:
        d = dict(r)
        d["match_reasons"] = json.loads(d["match_reasons"]) if d["match_reasons"] else []
        d["relevant_skills"] = json.loads(d["relevant_skills"]) if d["relevant_skills"] else []
        apps.append(d)
    return apps

# 13. GET PROJECT WITHDRAWALS (For Organization to review simulated payouts)
@router.get("/{project_id}/withdrawals")
def get_project_withdrawals(project_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT w.*, p.display_name, p.email
    FROM withdrawal_requests w
    JOIN profiles p ON p.id = w.student_id
    WHERE w.project_id = ?
    ORDER BY w.requested_at DESC
    """, (project_id,))
    rows = cursor.fetchall()
    conn.close()

    wdrs = []
    for r in rows:
        d = dict(r)
        d["payout_profile"] = json.loads(d["payout_profile"]) if d["payout_profile"] else {}
        wdrs.append(d)
    return wdrs

# 14. GET PROJECT CONTRIBUTIONS
@router.get("/{project_id}/contributions")
def get_project_contributions(project_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.*, p.display_name, p.email, t.title as task_title
    FROM contributions c
    JOIN profiles p ON p.id = c.contributor_id
    LEFT JOIN tasks t ON t.id = c.task_id
    WHERE c.project_id = ?
    ORDER BY c.created_at DESC
    """, (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# 15. SUBMIT RATING (Bilateral: Student rates Org, Org rates Student, Mentor rates)
@router.post("/{project_id}/ratings")
def submit_rating(project_id: str, payload: SubmitRatingPayload):
    conn = get_db()
    cursor = conn.cursor()
    now_ts = datetime.now(timezone.utc).isoformat()
    rating_id = f"rate-{uuid.uuid4().hex[:8]}"

    try:
        overall = round((payload.technical + payload.collaboration + payload.timeline + payload.charter_integrity) / 4.0, 1)
        cursor.execute("""
        INSERT INTO ratings (id, project_id, rater_id, rated_id, technical, collaboration, timeline, charter_integrity, overall, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id, rater_id, rated_id) DO UPDATE SET
            technical = excluded.technical,
            collaboration = excluded.collaboration,
            timeline = excluded.timeline,
            charter_integrity = excluded.charter_integrity,
            overall = excluded.overall,
            comment = excluded.comment,
            created_at = excluded.created_at
        """, (rating_id, project_id, payload.rater_id, payload.rated_id, payload.technical,
              payload.collaboration, payload.timeline, payload.charter_integrity, overall, payload.comment, now_ts))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error recording rating: {e}")

    conn.close()

    ledger_service.append_entry(
        project_id=project_id,
        actor_id=payload.rater_id,
        actor_type="human",
        action=f"Submitted Bilateral Rating (Tech: {payload.technical}/5, Collab: {payload.collaboration}/5, Charter: {payload.charter_integrity}/5)",
        content_payload=f"{rating_id}|{payload.rated_id}|{now_ts}"
    )

    return {"rating_id": rating_id, "status": "success", "message": "Rating recorded and committed to ledger."}

# 16. GET RATINGS FOR PROJECT
@router.get("/{project_id}/ratings")
def get_project_ratings(project_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.*, rater.display_name as rater_name, rated.display_name as rated_name
    FROM ratings r
    JOIN profiles rater ON rater.id = r.rater_id
    JOIN profiles rated ON rated.id = r.rated_id
    WHERE r.project_id = ?
    ORDER BY r.created_at DESC
    """, (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# 17. GET USER PORTFOLIO (Verified achievements only, zero confidential data leaked)
@router.get("/users/{user_id}/portfolio")
def get_user_portfolio(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
    prof = cursor.fetchone()
    if not prof:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found")

    # Get verified contributions
    cursor.execute("""
    SELECT c.id, c.project_id, c.file_name, c.description, c.credits_awarded, c.content_hash, c.reviewed_at, p.title as project_title
    FROM contributions c
    JOIN projects p ON p.id = c.project_id
    WHERE c.contributor_id = ? AND c.status = 'approved'
    ORDER BY c.reviewed_at DESC
    """, (user_id,))
    verified_contributions = [dict(r) for r in cursor.fetchall()]

    # Total credits
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM credits WHERE user_id = ?", (user_id,))
    total_credits = cursor.fetchone()["total"]

    # Projects participated in
    cursor.execute("""
    SELECT p.id, p.title, p.domain, pm.role, pm.joined_at
    FROM project_members pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.user_id = ?
    """, (user_id,))
    projects_participated = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "profile": {
            "id": prof["id"],
            "display_name": prof["display_name"],
            "role": prof["role"],
            "education": prof["education"],
            "skills": json.loads(prof["skills"]) if prof["skills"] else [],
            "domains": prof["domains"],
            "bio": prof["bio"],
            "verified": bool(prof["verified"]),
        },
        "total_credits": total_credits,
        "verified_contributions": verified_contributions,
        "projects_participated": projects_participated,
    }

# 18. GET REAL DASHBOARD METRICS FOR USER
@router.get("/users/{user_id}/dashboard")
def get_user_dashboard(user_id: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
    prof = cursor.fetchone()
    if not prof:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found")

    role = prof["role"]
    data: Dict[str, Any] = {"role": role, "profile": dict(prof)}

    if role == "student":
        # Total credits
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM credits WHERE user_id = ?", (user_id,))
        total_credits = cursor.fetchone()["total"]

        # Projects joined
        cursor.execute("""
        SELECT p.id, p.title, p.withdrawal_threshold, p.budget, pm.joined_at
        FROM project_members pm
        JOIN projects p ON p.id = pm.project_id
        WHERE pm.user_id = ?
        """, (user_id,))
        joined_projects = [dict(r) for r in cursor.fetchall()]

        # Tasks assigned / in-progress
        cursor.execute("""
        SELECT t.*, p.title as project_title FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.assigned_to = ?
        ORDER BY t.updated_at DESC
        """, (user_id,))
        tasks = [dict(r) for r in cursor.fetchall()]

        # Recent credit entries
        cursor.execute("SELECT * FROM credits WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", (user_id,))
        recent_credits = [dict(r) for r in cursor.fetchall()]

        # Pending withdrawals
        cursor.execute("SELECT * FROM withdrawal_requests WHERE student_id = ? ORDER BY requested_at DESC", (user_id,))
        withdrawals = [dict(r) for r in cursor.fetchall()]

        data["total_credits"] = total_credits
        data["credits_balance"] = total_credits
        data["joined_projects"] = joined_projects
        data["tasks"] = tasks
        data["recent_credits"] = recent_credits
        data["withdrawals"] = withdrawals
        data["withdrawal_eligible"] = any(total_credits >= (p.get("withdrawal_threshold") or 50) for p in joined_projects) if joined_projects else (total_credits >= 25)

    elif role == "organization":
        # Projects owned
        cursor.execute("SELECT * FROM projects WHERE org_id = ? ORDER BY created_at DESC", (user_id,))
        projects_owned = [dict(r) for r in cursor.fetchall()]

        # Escrow summary across projects
        cursor.execute("""
        SELECT COALESCE(SUM(total_budget), 0) as total_funded,
               COALESCE(SUM(available_balance), 0) as total_available,
               COALESCE(SUM(released_balance), 0) as total_released
        FROM escrow_accounts e
        JOIN projects p ON p.id = e.project_id
        WHERE p.org_id = ?
        """, (user_id,))
        escrow_stats = dict(cursor.fetchone())

        # Pending applications across org projects
        cursor.execute("""
        SELECT a.*, p.title as project_title, pr.display_name as applicant_name
        FROM applications a
        JOIN projects p ON p.id = a.project_id
        JOIN profiles pr ON pr.id = a.user_id
        WHERE p.org_id = ? AND a.status = 'pending'
        ORDER BY a.created_at DESC
        """, (user_id,))
        pending_applications = [dict(r) for r in cursor.fetchall()]

        # Pending withdrawals across org projects
        cursor.execute("""
        SELECT w.*, p.title as project_title, pr.display_name as student_name
        FROM withdrawal_requests w
        JOIN projects p ON p.id = w.project_id
        JOIN profiles pr ON pr.id = w.student_id
        WHERE p.org_id = ? AND w.status = 'pending'
        ORDER BY w.requested_at DESC
        """, (user_id,))
        pending_withdrawals = [dict(r) for r in cursor.fetchall()]

        data["projects_owned"] = projects_owned
        data["escrow_stats"] = escrow_stats
        data["pending_applications"] = pending_applications
        data["pending_withdrawals"] = pending_withdrawals

    elif role == "mentor":
        # Projects assigned
        cursor.execute("""
        SELECT p.* FROM project_members pm
        JOIN projects p ON p.id = pm.project_id
        WHERE pm.user_id = ? AND pm.role = 'mentor'
        """, (user_id,))
        projects_assigned = [dict(r) for r in cursor.fetchall()]

        # Pending contributions to review
        cursor.execute("""
        SELECT c.*, p.title as project_title, pr.display_name as contributor_name, t.title as task_title
        FROM contributions c
        JOIN projects p ON p.id = c.project_id
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ? AND pm.role = 'mentor'
        JOIN profiles pr ON pr.id = c.contributor_id
        LEFT JOIN tasks t ON t.id = c.task_id
        WHERE c.status = 'under_review'
        ORDER BY c.created_at ASC
        """, (user_id,))
        pending_reviews = [dict(r) for r in cursor.fetchall()]

        data["projects_assigned"] = projects_assigned
        data["pending_reviews"] = pending_reviews

    conn.close()
    return data

# 19. PROFILE GET & SYNC
@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
    prof = cursor.fetchone()
    conn.close()
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found")
    d = dict(prof)
    d["skills"] = json.loads(d["skills"]) if d["skills"] else []
    return d

class UpdateProfilePayload(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    org_name: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    domains: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[str] = None
    portfolio_url: Optional[str] = None

@router.post("/users/{user_id}/profile")
def update_user_profile(user_id: str, payload: UpdateProfilePayload):
    conn = get_db()
    cursor = conn.cursor()
    now_ts = datetime.now(timezone.utc).isoformat()

    cursor.execute("SELECT id FROM profiles WHERE id = ?", (user_id,))
    exists = cursor.fetchone()

    skills_json = json.dumps(payload.skills) if payload.skills is not None else None

    if exists:
        cursor.execute("""
        UPDATE profiles
        SET display_name = COALESCE(?, display_name),
            role = COALESCE(?, role),
            email = COALESCE(?, email),
            org_name = COALESCE(?, org_name),
            education = COALESCE(?, education),
            skills = COALESCE(?, skills),
            domains = COALESCE(?, domains),
            bio = COALESCE(?, bio),
            experience = COALESCE(?, experience),
            availability = COALESCE(?, availability),
            portfolio_url = COALESCE(?, portfolio_url),
            updated_at = ?
        WHERE id = ?
        """, (
            payload.display_name, payload.role, payload.email, payload.org_name,
            payload.education, skills_json, payload.domains, payload.bio,
            payload.experience, payload.availability, payload.portfolio_url,
            now_ts, user_id
        ))
    else:
        cursor.execute("""
        INSERT INTO profiles (
            id, role, display_name, email, org_name, education, skills, domains, bio,
            experience, availability, portfolio_url, verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, (
            user_id, payload.role or "student", payload.display_name or "User",
            payload.email or "", payload.org_name or "", payload.education or "",
            skills_json or "[]", payload.domains or "", payload.bio or "",
            payload.experience or "", payload.availability or "20 hrs/week",
            payload.portfolio_url or "", now_ts, now_ts
        ))

    conn.commit()
    conn.close()
    return {"status": "success", "message": "Profile updated."}

# 24. REJECT APPLICANT
class RejectApplicantPayload(BaseModel):
    reviewer_id: str
    reason: Optional[str] = "Application declined"

@router.post("/applications/{application_id}/reject")
def reject_applicant(application_id: str, payload: RejectApplicantPayload):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM applications WHERE id = ?", (application_id,))
    app = cursor.fetchone()
    if not app:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")

    now_ts = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "UPDATE applications SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?",
        (payload.reviewer_id, now_ts, application_id)
    )
    conn.commit()
    conn.close()

    # Log rejection to persistent ledger
    ledger_service.append_entry(
        project_id=app["project_id"],
        actor_id=payload.reviewer_id,
        actor_type="human",
        action=f"Rejected Application for {app['role'].title()} (App ID: {application_id})",
        content_payload=f"{application_id}|{app['user_id']}|{payload.reason}|{now_ts}"
    )

    return {"status": "rejected", "message": "Application rejected."}

# 25. GET APPLICATIONS FOR CURRENT USER (Student submissions OR Org incoming)
@router.get("/user/{user_id}/applications")
def get_user_applications(user_id: str):
    conn = get_db()
    cursor = conn.cursor()

    # Check user role
    cursor.execute("SELECT role FROM profiles WHERE id = ?", (user_id,))
    profile = cursor.fetchone()
    role = profile["role"] if profile else "student"

    if role in ["organization", "admin"]:
        # Show all applications to projects owned by this org (or all for admin)
        if role == "admin":
            cursor.execute("""
            SELECT a.*, p.title as project_title, p.domain, p.org_id,
                   u.display_name, u.email, u.education, u.skills as applicant_skills, u.availability
            FROM applications a
            JOIN projects p ON p.id = a.project_id
            JOIN profiles u ON u.id = a.user_id
            ORDER BY a.created_at DESC
            """)
        else:
            cursor.execute("""
            SELECT a.*, p.title as project_title, p.domain, p.org_id,
                   u.display_name, u.email, u.education, u.skills as applicant_skills, u.availability
            FROM applications a
            JOIN projects p ON p.id = a.project_id
            JOIN profiles u ON u.id = a.user_id
            WHERE p.org_id = ?
            ORDER BY a.created_at DESC
            """, (user_id,))
    else:
        # Student or mentor: return their submitted applications
        cursor.execute("""
        SELECT a.*, p.title as project_title, p.domain, p.org_id,
               org.display_name as org_name, org.org_name as organization_title
        FROM applications a
        JOIN projects p ON p.id = a.project_id
        LEFT JOIN profiles org ON org.id = p.org_id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["match_reasons"] = json.loads(d["match_reasons"]) if d.get("match_reasons") else []
        d["relevant_skills"] = json.loads(d["relevant_skills"]) if d.get("relevant_skills") else []
        if "applicant_skills" in d and d["applicant_skills"]:
            d["applicant_skills"] = json.loads(d["applicant_skills"])
        result.append(d)

    return result

# 26. ADMIN STATISTICS
@router.get("/admin/stats")
def get_admin_stats():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM profiles")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM profiles WHERE verified = 1")
    verified_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM projects WHERE status = 'open' OR status = 'active'")
    active_projects = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM ledger_entries")
    ledger_entries = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM ai_activity_logs")
    ai_logs = cursor.fetchone()[0]

    conn.close()

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "unverified_users": total_users - verified_users,
        "active_projects": active_projects,
        "ledger_entries": ledger_entries,
        "ai_logs": ai_logs,
        "open_disputes": 0
    }

# 27. ADMIN USER LIST & VERIFICATION
@router.get("/admin/users")
def get_admin_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    users = []
    for r in rows:
        d = dict(r)
        d["skills"] = json.loads(d["skills"]) if d.get("skills") else []
        d["domains"] = json.loads(d["domains"]) if d.get("domains") else []
        d["verified"] = bool(d.get("verified"))
        users.append(d)
    return users

@router.post("/admin/users/{user_id}/verify")
def toggle_user_verify(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT verified FROM profiles WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    new_val = 0 if row["verified"] == 1 else 1
    cursor.execute("UPDATE profiles SET verified = ?, updated_at = ? WHERE id = ?",
                   (new_val, datetime.now(timezone.utc).isoformat(), user_id))
    conn.commit()
    conn.close()

    return {"status": "success", "verified": bool(new_val)}

# 28. ADMIN AI LOGS
@router.get("/admin/ai-logs")
def get_admin_ai_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT l.*, p.display_name as human_owner_name, p.email as human_owner_email
    FROM ai_activity_logs l
    LEFT JOIN profiles p ON p.id = l.human_owner_id
    ORDER BY l.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

