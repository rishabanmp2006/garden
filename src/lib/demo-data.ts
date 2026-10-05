/* ============================================================
   Demo / Seed Data for ResearchMesh
   Used when Supabase is not configured or in demo mode.
   All data is fictional. No real personal information.
   ============================================================ */

import type {
  User, Profile, Organization, Project, Milestone,
  Membership, Contribution, LedgerEntry, Credit,
  Application, AILog, Charter, Escrow, Rating,
} from '../types';

// ---- Demo Users ----

export const DEMO_USERS: User[] = [
  {
    id: 'user-org-1',
    email: 'admin@novabiotech.org',
    role: 'organization',
    display_name: 'Nova Biotech Labs',
    verified: true,
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'user-student-1',
    email: 'rishaban@university.edu',
    role: 'student',
    display_name: 'Rishaban MP',
    verified: true,
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'user-student-2',
    email: 'priya.sharma@university.edu',
    role: 'student',
    display_name: 'Priya Sharma',
    verified: true,
    created_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'user-student-3',
    email: 'arun.kumar@university.edu',
    role: 'student',
    display_name: 'Arun Kumar',
    verified: true,
    created_at: '2026-09-03T10:00:00Z',
  },
  {
    id: 'user-mentor-1',
    email: 'dr.meera@research.org',
    role: 'mentor',
    display_name: 'Dr. Meera Krishnan',
    verified: true,
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'user-admin-1',
    email: 'admin@researchmesh.io',
    role: 'admin',
    display_name: 'System Admin',
    verified: true,
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 'user-org-2',
    email: 'contact@openedu.org',
    role: 'organization',
    display_name: 'OpenEdu Foundation',
    verified: true,
    created_at: '2026-08-25T10:00:00Z',
  },
];

// ---- Demo Profiles ----

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'profile-1',
    user_id: 'user-student-1',
    role: 'student',
    skills: ['Python', 'PyTorch', 'Computer Vision', 'TensorFlow', 'Edge AI'],
    interests: ['Medical imaging', 'Affordable healthcare', 'Deep learning'],
    education: 'B.Tech Computer Science, IIT Madras (2024–2028)',
    experience: '2 ML research internships, 1 published paper on retinal imaging',
    availability: 'Part-time (20 hrs/week)',
    portfolio_links: ['https://github.com/rishaban-demo'],
    bio: 'Undergraduate researcher focused on making AI-driven healthcare accessible.',
  },
  {
    id: 'profile-2',
    user_id: 'user-student-2',
    role: 'student',
    skills: ['Python', 'Data Analysis', 'NLP', 'Statistics', 'R'],
    interests: ['Biostatistics', 'Clinical trials', 'Public health'],
    education: 'M.Sc Biostatistics, AIIMS Delhi (2025–2027)',
    experience: '1 year research assistant, WHO data project',
    availability: 'Part-time (15 hrs/week)',
    bio: 'Biostatistics student interested in data-driven health research.',
  },
  {
    id: 'profile-3',
    user_id: 'user-student-3',
    role: 'student',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    interests: ['EdTech', 'Open source', 'Accessible STEM'],
    education: 'B.E. Information Science, RVCE Bangalore (2023–2027)',
    experience: 'Open-source contributor, 2 internships in web development',
    availability: 'Full-time (40 hrs/week)',
    bio: 'Full-stack developer passionate about education technology.',
  },
  {
    id: 'profile-4',
    user_id: 'user-mentor-1',
    role: 'mentor',
    skills: ['Machine Learning', 'Medical Imaging', 'Research Methodology'],
    interests: ['Ophthalmology AI', 'Edge computing', 'Clinical validation'],
    expertise: 'Computer Vision in Medical Diagnostics',
    domains: ['Healthcare AI', 'Ophthalmology', 'Edge Computing'],
    certifications: ['Ph.D. Computer Science, IISc Bangalore', 'Google ML Certified'],
    bio: 'Associate Professor with 12 years of experience in medical AI research.',
  },
  {
    id: 'profile-5',
    user_id: 'user-org-1',
    role: 'organization',
    skills: [],
    interests: [],
    org_name: 'Nova Biotech Labs',
    org_industry: 'Healthcare & Biotechnology',
    org_description: 'Nova Biotech Labs is a research-focused biotech company developing AI-powered diagnostic tools for underserved communities.',
  },
  {
    id: 'profile-6',
    user_id: 'user-org-2',
    role: 'organization',
    skills: [],
    interests: [],
    org_name: 'OpenEdu Foundation',
    org_industry: 'Education & Non-profit',
    org_description: 'OpenEdu Foundation builds open-source tools and curricula to make STEM education accessible worldwide.',
  },
];

// ---- Demo Organizations ----

export const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    owner_id: 'user-org-1',
    name: 'Nova Biotech Labs',
    industry: 'Healthcare & Biotechnology',
    research_areas: ['Medical Imaging', 'Edge AI', 'Diagnostics'],
    description: 'Nova Biotech Labs is a research-focused biotech company developing AI-powered diagnostic tools for underserved communities.',
    verified: true,
    rating_avg: 4.6,
    rating_count: 12,
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'org-2',
    owner_id: 'user-org-2',
    name: 'OpenEdu Foundation',
    industry: 'Education & Non-profit',
    research_areas: ['EdTech', 'STEM Accessibility', 'Open Source'],
    description: 'OpenEdu Foundation builds open-source tools and curricula to make STEM education accessible worldwide.',
    verified: true,
    rating_avg: 4.8,
    rating_count: 8,
    created_at: '2026-08-25T10:00:00Z',
  },
];

// ---- Demo Projects ----

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    org_id: 'org-1',
    organization: DEMO_ORGANIZATIONS[0],
    title: 'Low-cost Diabetic Retinopathy Detection on Edge Devices',
    public_summary: 'Develop a lightweight deep learning model for diabetic retinopathy screening that runs on low-cost edge hardware (Raspberry Pi, Jetson Nano). The goal is to enable affordable eye disease screening in rural clinics without reliable internet.',
    confidential_brief: 'Nova Biotech has a proprietary dataset of 45,000 annotated retinal scans from partner hospitals. The model must achieve >90% sensitivity on our internal validation set. We are targeting FDA Class II regulatory submission in 2027. Our proprietary preprocessing pipeline (NovaScan v3) must be used.',
    domain: 'Healthcare AI',
    required_skills: ['Python', 'PyTorch', 'Computer Vision', 'Edge AI', 'Medical Imaging'],
    engagement_model: 'funded',
    budget: 100000,
    sensitivity_level: 'high',
    ai_policy: {
      cloud_allowed: false,
      local_required: true,
      approved_models: ['llama3', 'codellama'],
      human_approval_required: true,
    },
    ip_ownership: 'Shared — Nova Biotech retains IP on proprietary pipeline; contributors retain IP on novel model architecture with license-back',
    authorship_rules: 'Co-authorship on publications for contributors with >15% contribution by verified credit',
    reward_structure: {
      platform_fee_percent: 5,
      ai_compute_percent: 10,
      expert_percent: 25,
      contributor_percent: 60,
    },
    commercialization_terms: 'Revenue share of 2% for 3 years from products using contributed model architecture',
    duration_days: 180,
    status: 'active',
    created_at: '2026-09-01T10:00:00Z',
    member_count: 5,
  },
  {
    id: 'proj-2',
    org_id: 'org-2',
    organization: DEMO_ORGANIZATIONS[1],
    title: 'Open Research Toolkit for Accessible STEM Education',
    public_summary: 'Build an open-source toolkit of interactive STEM learning modules with multilingual support, screen-reader compatibility, and offline-first architecture. Targeting grades 8–12 in under-resourced schools.',
    domain: 'Education Technology',
    required_skills: ['React', 'TypeScript', 'Node.js', 'Accessibility', 'i18n'],
    engagement_model: 'knowledge_sharing',
    budget: 0,
    sensitivity_level: 'low',
    ai_policy: {
      cloud_allowed: true,
      local_required: false,
      approved_models: [],
      human_approval_required: false,
    },
    ip_ownership: 'All contributions licensed under MIT License',
    authorship_rules: 'All contributors credited in project documentation and releases',
    commercialization_terms: 'Non-commercial. All outputs remain open source.',
    duration_days: 120,
    status: 'open',
    created_at: '2026-09-10T10:00:00Z',
    member_count: 2,
  },
];

// ---- Demo Milestones ----

export const DEMO_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    project_id: 'proj-1',
    title: 'Data Pipeline & Preprocessing',
    description: 'Build the data preprocessing pipeline using NovaScan v3 for retinal scan normalization and augmentation.',
    deliverables: ['Preprocessing pipeline code', 'Data augmentation module', 'Pipeline documentation'],
    acceptance_criteria: 'Pipeline processes 1000 images/hour on target hardware with <2% data loss',
    budget_allocation: 20000,
    due_date: '2026-10-15T00:00:00Z',
    status: 'accepted',
    reviewed_by: 'user-mentor-1',
    completed_at: '2026-10-12T00:00:00Z',
  },
  {
    id: 'ms-2',
    project_id: 'proj-1',
    title: 'Model Architecture & Training',
    description: 'Design and train a lightweight CNN/transformer hybrid model optimized for edge inference.',
    deliverables: ['Model architecture code', 'Training scripts', 'Validation results', 'Model card'],
    acceptance_criteria: '>90% sensitivity, >85% specificity on internal validation set; model size <50MB',
    budget_allocation: 40000,
    due_date: '2026-12-01T00:00:00Z',
    status: 'in_progress',
  },
  {
    id: 'ms-3',
    project_id: 'proj-1',
    title: 'Edge Deployment & Optimization',
    description: 'Optimize model for Raspberry Pi 4 and Jetson Nano. Build inference service with <3s response time.',
    deliverables: ['Optimized model (ONNX/TFLite)', 'Inference service', 'Deployment guide', 'Performance benchmarks'],
    acceptance_criteria: 'Inference <3s on RPi4, <1s on Jetson Nano, within 2GB RAM',
    budget_allocation: 30000,
    due_date: '2027-02-01T00:00:00Z',
    status: 'pending',
  },
  {
    id: 'ms-4',
    project_id: 'proj-1',
    title: 'Clinical Validation Report',
    description: 'Prepare clinical validation documentation for regulatory submission.',
    deliverables: ['Validation report', 'Statistical analysis', 'Regulatory documentation draft'],
    acceptance_criteria: 'Report meets FDA Class II submission requirements',
    budget_allocation: 10000,
    due_date: '2027-03-01T00:00:00Z',
    status: 'pending',
  },
];

// ---- Demo Memberships ----

export const DEMO_MEMBERSHIPS: Membership[] = [
  { id: 'mem-1', project_id: 'proj-1', user_id: 'user-org-1', role: 'organization', charter_version_accepted: 1, joined_at: '2026-09-01T10:00:00Z', status: 'active' },
  { id: 'mem-2', project_id: 'proj-1', user_id: 'user-student-1', role: 'workspace_manager', charter_version_accepted: 1, joined_at: '2026-09-05T10:00:00Z', status: 'active' },
  { id: 'mem-3', project_id: 'proj-1', user_id: 'user-student-2', role: 'student', charter_version_accepted: 1, joined_at: '2026-09-06T10:00:00Z', status: 'active' },
  { id: 'mem-4', project_id: 'proj-1', user_id: 'user-mentor-1', role: 'mentor', charter_version_accepted: 1, joined_at: '2026-09-04T10:00:00Z', status: 'active' },
  { id: 'mem-5', project_id: 'proj-1', user_id: 'user-student-3', role: 'student', joined_at: '2026-09-10T10:00:00Z', status: 'active' },
];

// ---- Demo Charter ----

export const DEMO_CHARTERS: Charter[] = [
  {
    id: 'charter-1',
    project_id: 'proj-1',
    version: 1,
    content: {
      engagement_model: 'funded',
      rewards: 'Total budget ₹1,00,000 distributed across milestones. Contributors receive 60% of milestone funds proportional to verified credit.',
      scope: 'Develop an edge-deployable diabetic retinopathy detection model using proprietary retinal scan dataset.',
      milestones: '4 milestones over 6 months: Data Pipeline, Model Training, Edge Deployment, Clinical Validation.',
      deliverables: 'Preprocessing pipeline, trained model, edge inference service, validation report.',
      acceptance_criteria: '>90% sensitivity, edge inference <3s, regulatory-ready documentation.',
      roles: 'Organization (sponsor), Workspace Manager, 2 Student Contributors, 1 Mentor/Expert Reviewer.',
      eligibility: 'Strong Python + PyTorch experience, computer vision background preferred.',
      time_commitment: 'Part-time: minimum 15 hours/week for 6 months.',
      ip_ownership: 'Shared IP. Nova retains proprietary pipeline IP. Contributors retain novel architecture IP with license-back.',
      publication_rules: 'Publications allowed after 6-month embargo. Co-authorship for >15% contribution.',
      authorship: 'Determined by verified contribution credit percentage.',
      confidentiality: 'HIGH. Proprietary dataset and preprocessing pipeline are strictly confidential. Local AI only.',
      permitted_ai_tools: 'Local LLM (Llama 3, CodeLlama). No cloud AI for project data.',
      credit_split: 'Based on reviewer-assessed contribution impact, not commit count.',
      exit_rules: 'Contributors may exit with 2 weeks notice. Accepted work retains credit. Unfinished work is reassigned.',
      dispute_rules: 'Disputes escalated to Mentor first, then Admin mediation. Ledger evidence required.',
      commercialization: 'Revenue share of 2% for 3 years from products using contributed model architecture.',
    },
    created_by: 'user-org-1',
    created_at: '2026-09-01T12:00:00Z',
    status: 'active',
  },
];

// ---- Demo Contributions ----

export const DEMO_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'contrib-1',
    project_id: 'proj-1',
    contributor_id: 'user-student-1',
    role: 'workspace_manager',
    type: 'code',
    description: 'Implemented retinal scan preprocessing pipeline with NovaScan v3 integration',
    ai_involvement: 'none',
    status: 'approved',
    credits_awarded: 45,
    created_at: '2026-09-20T14:30:00Z',
  },
  {
    id: 'contrib-2',
    project_id: 'proj-1',
    contributor_id: 'user-student-1',
    role: 'workspace_manager',
    type: 'ai_assisted',
    description: 'Generated data augmentation module with Developer Agent assistance',
    ai_involvement: 'ai_assisted',
    ai_agent_id: 'agent-dev-1',
    human_owner_id: 'user-student-1',
    status: 'approved',
    credits_awarded: 30,
    created_at: '2026-09-25T10:00:00Z',
  },
  {
    id: 'contrib-3',
    project_id: 'proj-1',
    contributor_id: 'user-student-2',
    role: 'student',
    type: 'dataset',
    description: 'Curated and validated 5,000 retinal scan annotations for training set',
    ai_involvement: 'none',
    status: 'approved',
    credits_awarded: 55,
    created_at: '2026-09-22T11:00:00Z',
  },
  {
    id: 'contrib-4',
    project_id: 'proj-1',
    contributor_id: 'user-mentor-1',
    role: 'mentor',
    type: 'review',
    description: 'Reviewed preprocessing pipeline and validated against clinical requirements',
    ai_involvement: 'none',
    reviewer_id: 'user-org-1',
    status: 'approved',
    credits_awarded: 35,
    created_at: '2026-09-28T16:00:00Z',
  },
  {
    id: 'contrib-5',
    project_id: 'proj-1',
    contributor_id: 'user-student-1',
    role: 'workspace_manager',
    type: 'documentation',
    description: 'Pipeline architecture documentation and deployment guide',
    ai_involvement: 'ai_assisted',
    ai_agent_id: 'agent-research-1',
    human_owner_id: 'user-student-1',
    status: 'approved',
    credits_awarded: 20,
    created_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 'contrib-6',
    project_id: 'proj-1',
    contributor_id: 'user-student-2',
    role: 'student',
    type: 'research',
    description: 'Literature review on lightweight CNN architectures for retinal imaging',
    ai_involvement: 'ai_assisted',
    ai_agent_id: 'agent-research-1',
    human_owner_id: 'user-student-2',
    status: 'approved',
    credits_awarded: 40,
    created_at: '2026-10-03T13:00:00Z',
  },
];

// ---- Demo Ledger Entries ----

export const DEMO_LEDGER: LedgerEntry[] = [
  {
    id: 1,
    project_id: 'proj-1',
    actor_id: 'user-org-1',
    actor_type: 'system',
    action: 'Project created',
    content_hash: 'a1b2c3d4e5f6',
    previous_hash: '0000000000',
    entry_hash: 'f6e5d4c3b2a1',
    timestamp: '2026-09-01T10:00:00Z',
  },
  {
    id: 2,
    project_id: 'proj-1',
    actor_id: 'user-student-1',
    actor_type: 'human',
    action: 'Charter v1 accepted',
    content_hash: 'b2c3d4e5f6a1',
    previous_hash: 'f6e5d4c3b2a1',
    entry_hash: 'c3d4e5f6a1b2',
    timestamp: '2026-09-05T10:00:00Z',
  },
  {
    id: 3,
    project_id: 'proj-1',
    actor_id: 'user-student-1',
    actor_type: 'human',
    action: 'Submitted preprocessing pipeline',
    contribution_id: 'contrib-1',
    content_hash: 'd4e5f6a1b2c3',
    previous_hash: 'c3d4e5f6a1b2',
    entry_hash: 'e5f6a1b2c3d4',
    timestamp: '2026-09-20T14:30:00Z',
  },
  {
    id: 4,
    project_id: 'proj-1',
    actor_id: 'agent-dev-1',
    actor_type: 'ai_agent',
    action: 'Generated augmentation module (Human owner: Rishaban MP)',
    contribution_id: 'contrib-2',
    content_hash: 'e5f6a1b2c3d4',
    previous_hash: 'e5f6a1b2c3d4',
    entry_hash: 'f6a1b2c3d4e5',
    timestamp: '2026-09-25T10:00:00Z',
  },
  {
    id: 5,
    project_id: 'proj-1',
    actor_id: 'user-student-2',
    actor_type: 'human',
    action: 'Submitted dataset annotations',
    contribution_id: 'contrib-3',
    content_hash: 'a1b2c3d4e5f6',
    previous_hash: 'f6a1b2c3d4e5',
    entry_hash: 'b2c3d4e5f6a1',
    timestamp: '2026-09-22T11:00:00Z',
  },
  {
    id: 6,
    project_id: 'proj-1',
    actor_id: 'user-mentor-1',
    actor_type: 'human',
    action: 'Reviewed and approved Milestone 1',
    content_hash: 'c3d4e5f6a1b2',
    previous_hash: 'b2c3d4e5f6a1',
    entry_hash: 'd4e5f6a1b2c3',
    timestamp: '2026-09-28T16:00:00Z',
  },
  {
    id: 7,
    project_id: 'proj-1',
    actor_id: 'system',
    actor_type: 'system',
    action: 'Credits awarded: 45 to Rishaban MP',
    content_hash: 'e5f6a1b2c3d4',
    previous_hash: 'd4e5f6a1b2c3',
    entry_hash: 'f6a1b2c3d4e5a',
    timestamp: '2026-09-28T16:05:00Z',
  },
];

// ---- Demo AI Logs ----

export const DEMO_AI_LOGS: AILog[] = [
  {
    id: 'ailog-1',
    agent_id: 'agent-research-1',
    project_id: 'proj-1',
    human_owner_id: 'user-student-1',
    agent_type: 'research',
    request: 'Summarize recent papers on lightweight CNN architectures for retinal imaging',
    response: 'Based on analysis of project documents and recent literature...',
    model: 'llama3',
    provider: 'local',
    data_sensitivity: 'high',
    input_scope: 'Project RDM-042 documents only',
    approval_status: 'approved',
    fallback_used: false,
    created_at: '2026-10-01T10:42:00Z',
  },
  {
    id: 'ailog-2',
    agent_id: 'agent-dev-1',
    project_id: 'proj-1',
    human_owner_id: 'user-student-1',
    agent_type: 'developer',
    request: 'Generate preprocessing function for retinal scan normalization',
    response: 'def preprocess_retinal_scan(image, target_size=(512, 512))...',
    model: 'codellama',
    provider: 'local',
    data_sensitivity: 'high',
    input_scope: 'Project RDM-042 codebase',
    approval_status: 'approved',
    approved_by: 'user-student-1',
    fallback_used: false,
    created_at: '2026-10-01T10:48:00Z',
  },
  {
    id: 'ailog-3',
    agent_id: 'agent-research-1',
    project_id: 'proj-1',
    human_owner_id: 'user-student-2',
    agent_type: 'research',
    request: 'Analyze annotation quality metrics for the current dataset batch',
    response: 'Primary local model unavailable. Cloud fallback blocked by project confidentiality policy. Escalated to mentor.',
    model: 'llama3',
    provider: 'local',
    data_sensitivity: 'high',
    input_scope: 'Project RDM-042 dataset',
    approval_status: 'pending',
    fallback_used: true,
    fallback_reason: 'Primary local model unavailable. Cloud fallback blocked by HIGH sensitivity policy. Escalated to human expert.',
    created_at: '2026-10-02T09:15:00Z',
  },
];

// ---- Demo Applications ----

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    project_id: 'proj-2',
    user_id: 'user-student-3',
    role: 'student',
    message: 'I have strong React/TypeScript experience and am passionate about accessible education. I\'d love to contribute to the frontend architecture.',
    match_score: 0.88,
    match_reasons: ['Strong React experience', 'TypeScript proficiency', 'EdTech interest', 'Matches required availability'],
    status: 'pending',
    created_at: '2026-10-04T10:00:00Z',
  },
];

// ---- Demo Escrow ----

export const DEMO_ESCROW: Escrow[] = [
  {
    id: 'escrow-1',
    project_id: 'proj-1',
    milestone_id: 'ms-1',
    total_amount: 20000,
    platform_fee: 1000,
    ai_compute_reserve: 2000,
    expert_allocation: 5000,
    contributor_pool: 12000,
    status: 'released',
    funded_at: '2026-09-01T10:00:00Z',
    released_at: '2026-10-12T10:00:00Z',
  },
  {
    id: 'escrow-2',
    project_id: 'proj-1',
    milestone_id: 'ms-2',
    total_amount: 40000,
    platform_fee: 2000,
    ai_compute_reserve: 4000,
    expert_allocation: 10000,
    contributor_pool: 24000,
    status: 'funded',
    funded_at: '2026-09-01T10:00:00Z',
  },
];

// ---- Demo Credits ----

export const DEMO_CREDITS: Credit[] = [
  { id: 'credit-1', user_id: 'user-student-1', project_id: 'proj-1', contribution_id: 'contrib-1', amount: 45, reason: 'Preprocessing pipeline implementation', created_at: '2026-09-28T16:05:00Z' },
  { id: 'credit-2', user_id: 'user-student-1', project_id: 'proj-1', contribution_id: 'contrib-2', amount: 30, reason: 'Data augmentation module (AI-assisted)', created_at: '2026-09-28T16:05:00Z' },
  { id: 'credit-3', user_id: 'user-student-2', project_id: 'proj-1', contribution_id: 'contrib-3', amount: 55, reason: 'Dataset annotation curation', created_at: '2026-09-28T16:05:00Z' },
  { id: 'credit-4', user_id: 'user-mentor-1', project_id: 'proj-1', contribution_id: 'contrib-4', amount: 35, reason: 'Pipeline review and clinical validation', created_at: '2026-09-28T16:05:00Z' },
  { id: 'credit-5', user_id: 'user-student-1', project_id: 'proj-1', contribution_id: 'contrib-5', amount: 20, reason: 'Documentation (AI-assisted)', created_at: '2026-10-01T09:05:00Z' },
  { id: 'credit-6', user_id: 'user-student-2', project_id: 'proj-1', contribution_id: 'contrib-6', amount: 40, reason: 'Literature review (AI-assisted)', created_at: '2026-10-03T13:05:00Z' },
];

// ---- Demo Ratings ----

export const DEMO_RATINGS: Rating[] = [];

// ---- Helper: Get user by ID ----

export function getDemoUser(id: string): User | undefined {
  return DEMO_USERS.find(u => u.id === id);
}

export function getDemoProfile(userId: string): Profile | undefined {
  return DEMO_PROFILES.find(p => p.user_id === userId);
}

export function getUserCredits(userId: string): number {
  return DEMO_CREDITS.filter(c => c.user_id === userId).reduce((sum, c) => sum + c.amount, 0);
}

export function getProjectMilestones(projectId: string): Milestone[] {
  return DEMO_MILESTONES.filter(m => m.project_id === projectId);
}

export function getProjectMembers(projectId: string): Membership[] {
  return DEMO_MEMBERSHIPS.filter(m => m.project_id === projectId);
}

export function getUserProjects(userId: string): Project[] {
  const memberProjectIds = DEMO_MEMBERSHIPS
    .filter(m => m.user_id === userId && m.status === 'active')
    .map(m => m.project_id);
  return DEMO_PROJECTS.filter(p => memberProjectIds.includes(p.id));
}
