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
      status: 'demo_fallback',
      service: 'ResearchMesh Client (Local Mode)',
      version: '1.0.0',
      ai_gateway: 'operational (in-memory)',
      sha256_ledger: 'synchronized (in-memory)',
    };
  }
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
