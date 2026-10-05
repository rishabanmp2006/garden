import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "researchmesh.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        verified INTEGER DEFAULT 0,
        skills TEXT DEFAULT '[]',
        domains TEXT DEFAULT '[]',
        education TEXT,
        experience TEXT,
        availability TEXT,
        bio TEXT,
        portfolio_links TEXT DEFAULT '[]',
        org_name TEXT,
        org_description TEXT,
        contact_email TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN password_hash TEXT")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN portfolio_url TEXT")
    except Exception:
        pass

    # Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        title TEXT NOT NULL,
        public_summary TEXT NOT NULL,
        confidential_brief TEXT NOT NULL,
        domain TEXT NOT NULL,
        required_skills TEXT DEFAULT '[]',
        sensitivity_level TEXT NOT NULL,
        engagement_model TEXT NOT NULL,
        budget REAL DEFAULT 0,
        withdrawal_threshold REAL DEFAULT 50,
        ai_policy TEXT DEFAULT '{}',
        ip_ownership TEXT NOT NULL,
        authorship_rules TEXT NOT NULL,
        commercialization_terms TEXT,
        reward_structure TEXT DEFAULT '{}',
        duration_days INTEGER DEFAULT 90,
        status TEXT DEFAULT 'open',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Project Members
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        joined_at TEXT NOT NULL,
        UNIQUE(project_id, user_id)
    )
    """)

    # Charters
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS charters (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        title TEXT NOT NULL,
        scope TEXT NOT NULL,
        ip_terms TEXT NOT NULL,
        authorship_terms TEXT NOT NULL,
        confidentiality_terms TEXT NOT NULL,
        ai_policy_terms TEXT NOT NULL,
        dispute_rules TEXT NOT NULL,
        withdrawal_rules TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        UNIQUE(project_id, version)
    )
    """)

    # Charter Acceptances
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS charter_acceptances (
        id TEXT PRIMARY KEY,
        charter_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        accepted_at TEXT NOT NULL,
        ip_hash TEXT,
        UNIQUE(charter_id, user_id)
    )
    """)

    # Applications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        message TEXT NOT NULL,
        relevant_skills TEXT DEFAULT '[]',
        match_score INTEGER DEFAULT 0,
        match_reasons TEXT DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(project_id, user_id)
    )
    """)

    # Milestones
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        deliverables TEXT DEFAULT '[]',
        acceptance_criteria TEXT NOT NULL,
        budget_allocation REAL DEFAULT 0,
        due_date TEXT,
        status TEXT DEFAULT 'pending',
        completed_at TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Tasks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        milestone_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT,
        status TEXT DEFAULT 'todo',
        credits_reward INTEGER DEFAULT 25,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Files
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        file_size TEXT NOT NULL,
        is_confidential INTEGER DEFAULT 0,
        sensitivity_level TEXT DEFAULT 'low',
        export_policy TEXT DEFAULT 'restricted',
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Contributions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contributions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        task_id TEXT,
        contributor_id TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        file_name TEXT,
        file_url TEXT,
        content_hash TEXT NOT NULL,
        ai_involvement TEXT DEFAULT 'none',
        status TEXT DEFAULT 'pending',
        credits_awarded INTEGER DEFAULT 0,
        reviewed_by TEXT,
        reviewed_at TEXT,
        review_comment TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Credits
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS credits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        contribution_id TEXT,
        task_id TEXT,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        awarded_by TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Withdrawal Requests
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        amount REAL NOT NULL,
        credits_exchanged INTEGER NOT NULL,
        payout_profile TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        requested_at TEXT NOT NULL,
        reviewed_by TEXT,
        reviewed_at TEXT,
        paid_at TEXT,
        rejection_reason TEXT
    )
    """)

    # Escrow
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS escrow_accounts (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE,
        total_budget REAL DEFAULT 0,
        available_balance REAL DEFAULT 0,
        released_balance REAL DEFAULT 0,
        status TEXT DEFAULT 'funded',
        updated_at TEXT NOT NULL
    )
    """)

    # Ratings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        rater_id TEXT NOT NULL,
        rated_id TEXT NOT NULL,
        technical INTEGER NOT NULL,
        collaboration INTEGER NOT NULL,
        timeline INTEGER NOT NULL,
        charter_integrity INTEGER NOT NULL,
        overall REAL NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(project_id, rater_id, rated_id)
    )
    """)

    # Ledger
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ledger_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        actor_id TEXT,
        actor_type TEXT NOT NULL,
        action TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        entry_hash TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT DEFAULT '{}'
    )
    """)

    # AI Activity Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_activity_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        human_owner_id TEXT,
        agent_type TEXT NOT NULL,
        request TEXT NOT NULL,
        response TEXT NOT NULL,
        model TEXT NOT NULL,
        data_sensitivity TEXT NOT NULL,
        approval_status TEXT NOT NULL,
        prompt_hash TEXT,
        response_hash TEXT,
        created_at TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

# Auto-initialize database schema on module load
init_db()
