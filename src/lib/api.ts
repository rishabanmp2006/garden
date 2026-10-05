/**
 * Centralized API client connecting to FastAPI backend
 * Automatically falls back to in-memory demo data if backend is offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      service: 'ResearchMesh Client',
      version: '1.0.0',
    };
  }
}

export async function authRegister(payload: {
  email: string;
  password: string;
  role: string;
  display_name: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  return await res.json();
}

export async function authLogin(payload: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Invalid email or password');
  }
  return await res.json();
}

export async function authProfile(userId: string) {
  const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return await res.json();
}

export async function queryAIGateway(payload: {
  project_id: string;
  user_id: string;
  agent_type: string;
  prompt: string;
  project_sensitivity: string;
  target_hardware?: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('AI Gateway request failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using local client gateway logic', err);
    return null;
  }
}
export async function fetchLedger(projectId?: string) {
  try {
    const url = projectId
      ? `${API_BASE_URL}/ledger?project_id=${encodeURIComponent(projectId)}`
      : `${API_BASE_URL}/ledger`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch ledger');
    return await res.json();
  } catch (err) {
    console.warn('Backend ledger endpoint failed', err);
    return [];
  }
}

export async function verifyLedger() {
  try {
    const res = await fetch(`${API_BASE_URL}/ledger/verify`);
    if (!res.ok) throw new Error('Ledger verify failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using local ledger verification', err);
    return null;
  }
}

export async function tamperLedger(blockId: number, tamperedAction: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ledger/tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_id: blockId, tampered_action: tamperedAction }),
    });
    if (!res.ok) throw new Error('Tamper request failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using local tamper simulation', err);
    return null;
  }
}

export async function restoreLedger() {
  try {
    const res = await fetch(`${API_BASE_URL}/ledger/restore`, { method: 'POST' });
    if (!res.ok) throw new Error('Restore failed');
    return await res.json();
  } catch (err) {
    return { status: 'success' };
  }
}

export async function generateWatermark(payload: {
  file_name: string;
  user_id: string;
  user_email: string;
  project_id: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/watermark/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Watermark generation failed');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function verifyWatermark(watermarkHash: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/watermark/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watermark_hash: watermarkHash }),
    });
    if (!res.ok) throw new Error('Watermark verification failed');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function matchCandidates(payload: {
  project_id: string;
  required_skills: string[];
  domain: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/matching/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Matching failed');
    return await res.json();
  } catch (err) {
    return null;
  }
}

// ==========================================
// REAL PROJECT & WORKSPACE LIFECYCLE API
// ==========================================

export async function fetchProjects() {
  const res = await fetch(`${API_BASE_URL}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return await res.json();
}

export async function fetchProjectDetails(projectId: string, userId?: string) {
  const url = userId
    ? `${API_BASE_URL}/projects/${projectId}?user_id=${encodeURIComponent(userId)}`
    : `${API_BASE_URL}/projects/${projectId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch project details');
  return await res.json();
}

export async function createProjectApi(payload: {
  org_id: string;
  org_name: string;
  title: string;
  public_summary: string;
  confidential_brief: string;
  domain: string;
  required_skills: string[];
  sensitivity_level?: string;
  engagement_model?: string;
  budget?: number;
  withdrawal_threshold?: number;
  duration_days?: number;
  ai_policy?: Record<string, any>;
  ip_ownership?: string;
  authorship_rules?: string;
  public_files?: string[];
  confidential_files?: string[];
}) {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create project' }));
    throw new Error(err.detail || 'Failed to create project');
  }
  return await res.json();
}

export async function applyToProjectApi(projectId: string, payload: {
  user_id: string;
  role?: string;
  message: string;
  relevant_skills?: string[];
}) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to apply' }));
    throw new Error(err.detail || 'Failed to apply');
  }
  return await res.json();
}

export async function fetchApplicationsApi(projectId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/applications`);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return await res.json();
}

export async function acceptApplicantApi(applicationId: string, reviewerId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/applications/${applicationId}/accept?reviewer_id=${encodeURIComponent(reviewerId)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to accept applicant');
  return await res.json();
}

export async function acceptCharterApi(projectId: string, userId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/accept-charter?user_id=${encodeURIComponent(userId)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to sign charter');
  return await res.json();
}

export async function createTaskApi(projectId: string, payload: {
  milestone_id: string;
  title: string;
  description: string;
  credits_reward?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function submitWorkApi(taskId: string, payload: {
  contributor_id: string;
  file_name: string;
  file_content: string;
  description: string;
  ai_involvement?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/tasks/${taskId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit work');
  return await res.json();
}

export async function fetchContributionsApi(projectId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/contributions`);
  if (!res.ok) throw new Error('Failed to fetch contributions');
  return await res.json();
}

export async function reviewWorkApi(contributionId: string, payload: {
  reviewer_id: string;
  verdict: 'approved' | 'rejected';
  comment: string;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/contributions/${contributionId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to review contribution');
  return await res.json();
}

export async function requestWithdrawalApi(projectId: string, payload: {
  student_id: string;
  amount: number;
  credits_exchanged: number;
  account_holder: string;
  masked_account: string;
  demo_ifsc: string;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to request withdrawal' }));
    throw new Error(err.detail || 'Withdrawal request rejected');
  }
  return await res.json();
}

export async function fetchWithdrawalsApi(projectId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/withdrawals`);
  if (!res.ok) throw new Error('Failed to fetch withdrawals');
  return await res.json();
}

export async function approveWithdrawalApi(withdrawalId: string, payload: {
  reviewer_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/withdrawals/${withdrawalId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update withdrawal status');
  return await res.json();
}

export async function submitRatingApi(projectId: string, payload: {
  rater_id: string;
  rated_id: string;
  technical: number;
  collaboration: number;
  timeline: number;
  charter_integrity: number;
  comment: string;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit rating');
  return await res.json();
}

export async function fetchRatingsApi(projectId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/ratings`);
  if (!res.ok) throw new Error('Failed to fetch ratings');
  return await res.json();
}

export async function fetchUserPortfolio(userId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/users/${userId}/portfolio`);
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return await res.json();
}

export async function fetchUserDashboard(userId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/users/${userId}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return await res.json();
}

export async function syncUserProfile(userId: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/projects/users/${userId}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to sync profile');
  return await res.json();
}

export async function fetchUserApplications(userId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/user/${userId}/applications`);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return await res.json();
}

export async function rejectApplicantApi(applicationId: string, payload: {
  reviewer_id: string;
  reason?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/projects/applications/${applicationId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to reject applicant');
  return await res.json();
}

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE_URL}/projects/admin/stats`);
  if (!res.ok) throw new Error('Failed to fetch admin statistics');
  return await res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE_URL}/projects/admin/users`);
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return await res.json();
}

export async function toggleUserVerifyApi(userId: string) {
  const res = await fetch(`${API_BASE_URL}/projects/admin/users/${userId}/verify`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle verification');
  return await res.json();
}

export async function fetchAdminAiLogs() {
  const res = await fetch(`${API_BASE_URL}/projects/admin/ai-logs`);
  if (!res.ok) throw new Error('Failed to fetch AI activity logs');
  return await res.json();
}

