import hashlib
import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def safe_json_list(val):
    if not val:
        return []
    if isinstance(val, list):
        return val
    try:
        loaded = json.loads(val)
        if isinstance(loaded, list):
            return loaded
        return [loaded]
    except Exception:
        if isinstance(val, str) and "," in val:
            return [x.strip() for x in val.split(",") if x.strip()]
        return [val] if val else []

class RegisterPayload(BaseModel):
    email: str
    password: str
    role: str
    display_name: str

class LoginPayload(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(payload: RegisterPayload):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM profiles WHERE LOWER(email) = LOWER(?)", (payload.email,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_id = str(uuid.uuid4())
    now_ts = datetime.now(timezone.utc).isoformat()
    pwd_hash = hash_password(payload.password)

    cursor.execute("""
    INSERT INTO profiles (
        id, email, password_hash, role, display_name, verified,
        skills, domains, education, experience, availability, bio, portfolio_links,
        org_name, org_description, contact_email, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, '[]', '[]', '', '', '20 hrs/week', '', '[]', ?, '', ?, ?, ?)
    """, (
        user_id, payload.email.lower(), pwd_hash, payload.role, payload.display_name,
        payload.display_name if payload.role == "organization" else "",
        payload.email.lower(), now_ts, now_ts
    ))
    conn.commit()

    cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    user_data = {
        "id": row["id"],
        "email": row["email"],
        "role": row["role"],
        "display_name": row["display_name"],
        "verified": bool(row["verified"]),
        "created_at": row["created_at"],
    }

    profile_dict = dict(row)
    del profile_dict["password_hash"]
    profile_dict["skills"] = safe_json_list(profile_dict.get("skills"))
    profile_dict["domains"] = safe_json_list(profile_dict.get("domains"))

    return {
        "user": user_data,
        "profile": profile_dict,
        "total_credits": 0,
    }

@router.post("/login")
def login(payload: LoginPayload):
    conn = get_db()
    cursor = conn.cursor()

    pwd_hash = hash_password(payload.password)
    cursor.execute("SELECT * FROM profiles WHERE LOWER(email) = LOWER(?)", (payload.email,))
    row = cursor.fetchone()

    if not row or (row["password_hash"] and row["password_hash"] != pwd_hash):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = row["id"]

    # Calculate real credits
    cursor.execute("SELECT SUM(amount) FROM credits WHERE user_id = ?", (user_id,))
    res = cursor.fetchone()
    total_credits = res[0] if res and res[0] is not None else 0

    conn.close()

    user_data = {
        "id": row["id"],
        "email": row["email"],
        "role": row["role"],
        "display_name": row["display_name"],
        "verified": bool(row["verified"]),
        "created_at": row["created_at"],
    }

    profile_dict = dict(row)
    if "password_hash" in profile_dict:
        del profile_dict["password_hash"]
    profile_dict["skills"] = safe_json_list(profile_dict.get("skills"))
    profile_dict["domains"] = safe_json_list(profile_dict.get("domains"))

    return {
        "user": user_data,
        "profile": profile_dict,
        "total_credits": total_credits,
    }

@router.get("/profile/{user_id}")
def get_profile(user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Profile not found.")

    cursor.execute("SELECT SUM(amount) FROM credits WHERE user_id = ?", (user_id,))
    res = cursor.fetchone()
    total_credits = res[0] if res and res[0] is not None else 0

    conn.close()

    user_data = {
        "id": row["id"],
        "email": row["email"],
        "role": row["role"],
        "display_name": row["display_name"],
        "verified": bool(row["verified"]),
        "created_at": row["created_at"],
    }

    profile_dict = dict(row)
    if "password_hash" in profile_dict:
        del profile_dict["password_hash"]
    profile_dict["skills"] = safe_json_list(profile_dict.get("skills"))
    profile_dict["domains"] = safe_json_list(profile_dict.get("domains"))

    return {
        "user": user_data,
        "profile": profile_dict,
        "total_credits": total_credits,
    }
