# ResearchMesh — Collaborative Research Ecosystem

> **Gardenia 2K26 Hackathon Prototype**  
> A governed, collaborative research platform where organizations, mentors, and students collaborate on research projects with controlled AI assistance, confidential-data protection, verifiable contribution tracking, simulated escrow, and cryptographic provenance.

---

## 🏛️ The Three Pillars

1. **Private AI & Policy Gateway**
   - Automatic model routing based on project data sensitivity (`Low`, `Medium`, `High`, `Critical`).
   - When sensitivity is `High` or `Critical`, cloud API egress is strictly blocked at the gateway level. Inferences are executed exclusively via local, air-gapped models (e.g. Ollama / Llama-3-8B).
   - Mandatory human approval queue: AI-assisted deliverables require mentor sign-off before being committed to the ledger.

2. **Verified Contribution & SHA-256 Provenance Ledger**
   - Every research deliverable, code commit, dataset annotation, and clinical review is logged as a block in an immutable SHA-256 hash chain.
   - Built-in **Ledger Integrity Verifier**: Sequentially recalculates all block hashes live in browser and backend.
   - Built-in **Tamper Simulator**: Simulates an unauthorized block modification, demonstrating instant mathematical detection of broken hash links.

3. **Fair Credit, Reputation & Simulated Escrow**
   - Pure AI generation cannot earn credit points; human researchers directing and verifying AI earn meritocratic credits.
   - Transparent publication co-authorship thresholds (e.g. guaranteed co-authorship for contributors exceeding >15% verified credits).
   - Automated multi-sig **Simulated Escrow Engine**: Tracks milestone fund allocation (60% Contributor Pool, 25% Mentor Allocation, 10% AI Compute Reserve, 5% Platform Maintenance) and simulates milestone fund releases.

---

## 🚀 Key Features

- **Role-Aware Dashboards**: Dedicated views tailored for Students, Organizations, Mentors, and Administrators.
- **One-Click Demo Access**: Instant switching between `Rishaban MP` (Student), `Nova Biotech Labs` (Organization), `Dr. Meera Krishnan` (Mentor), and `System Admin`.
- **Governed Research Workspaces**: Interactive Kanban task boards, milestone progress tracking, and signed Charter v1.0 governance terms.
- **Confidential Data Room & Watermarked Downloads**: Protected proprietary files are dynamically stamped with a cryptographic watermark (`CONFIDENTIAL • LICENSED TO USER • TIMESTAMP • SHA-256 HASH`) and logged to an audit trail.
- **Watermark Forensic Inspector**: Trace leaked files by verifying embedded watermark signatures.
- **AI Candidate Matching**: Evaluates candidate compatibility scores (e.g., 96% Match) against project domain prerequisites and past verified credits.
- **Verifiable Academic Portfolio**: Exports standard W3C Verifiable Credentials (JSON-LD) with cryptographic proof signatures.
- **Multi-Dimensional Peer Ratings**: Evaluates collaborators on Technical Depth, Collaboration, Timeline Adherence, and Charter Integrity.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, React Router v7
- **Backend**: Python 3.14, FastAPI, Uvicorn, Pydantic v2, HTTPX
- **Cryptography**: SHA-256 hash chaining, HMAC-SHA256 watermarking, W3C Verifiable Credentials format

---

## 🏃 Getting Started

### 1. Frontend

```bash
# Install dependencies
npm install

# Run Vite dev server (runs at http://localhost:5173/)
npm run dev

# Run production build
npm run build
```

### 2. Backend (FastAPI)

```bash
# Setup virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Start backend API (runs at http://localhost:8000/, docs at http://localhost:8000/docs)
PYTHONPATH=. uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Run API unit test suite (7/7 tests)
PYTHONPATH=. python3 backend/tests/test_api.py
```

---

## 🧪 Testing the Live System

1. Open **`http://localhost:5173/`** in your browser.
2. Click **"Get Started"** or **"Sign In"**.
3. Use the one-click demo login buttons to test each role:
   - **Student**: View active research workspaces, tasks, earned credits, and portfolio.
   - **Organization**: Post research projects, review candidate proposals, and release milestone escrow.
   - **Mentor**: Inspect peer contributions and sign off on AI-assisted milestones.
   - **Admin**: Audit the global SHA-256 ledger, adjudicate disputes, and verify academic credentials.
4. Navigate to `/workspace/proj-1` to interact with:
   - The **AI Policy Gateway** with preset queries.
   - The **Confidential Data Room** with watermarked downloads.
   - The **SHA-256 Ledger** with live verification and tamper simulation.
