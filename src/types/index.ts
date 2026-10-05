/* ============================================================
   ResearchMesh — Shared Type Definitions
   ============================================================ */

export type UserRole = 'student' | 'organization' | 'mentor' | 'admin';

export type ProjectStatus = 'draft' | 'open' | 'active' | 'paused' | 'completed' | 'archived';

export type EngagementModel = 'funded' | 'stipend' | 'knowledge_sharing' | 'institutional_credit';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type MembershipStatus = 'active' | 'suspended' | 'left' | 'removed';

export type MilestoneStatus = 'pending' | 'in_progress' | 'review' | 'accepted' | 'rejected';

export type ContributionType =
  | 'research' | 'code' | 'dataset' | 'documentation'
  | 'review' | 'experiment' | 'design' | 'testing' | 'ai_assisted';

export type AIInvolvement = 'none' | 'ai_assisted' | 'ai_generated';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type AgentType = 'research' | 'developer' | 'reviewer';

export type ExportPolicy = 'restricted' | 'authorized_only' | 'open';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

/* ---- User & Profile ---- */

export interface User {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  skills: string[];
  interests: string[];
  education?: string;
  experience?: string;
  expertise?: string;
  domains?: string[];
  certifications?: string[];
  org_name?: string;
  org_industry?: string;
  org_description?: string;
  availability?: string;
  portfolio_links?: string[];
  bio?: string;
}

/* ---- Organization ---- */

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  industry: string;
  research_areas: string[];
  description: string;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

/* ---- Project ---- */

export interface Project {
  id: string;
  org_id: string;
  organization?: Organization;
  title: string;
  public_summary: string;
  confidential_brief?: string;
  domain: string;
  required_skills: string[];
  engagement_model: EngagementModel;
  budget: number;
  sensitivity_level: SensitivityLevel;
  ai_policy: AIPolicy;
  ip_ownership?: string;
  authorship_rules?: string;
  reward_structure?: RewardStructure;
  commercialization_terms?: string;
  duration_days: number;
  status: ProjectStatus;
  created_at: string;
  milestones?: Milestone[];
  member_count?: number;
}

export interface AIPolicy {
  cloud_allowed: boolean;
  local_required: boolean;
  approved_models: string[];
  human_approval_required: boolean;
}

export interface RewardStructure {
  platform_fee_percent: number;
  ai_compute_percent: number;
  expert_percent: number;
  contributor_percent: number;
}

/* ---- Application ---- */

export interface Application {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  message: string;
  match_score?: number;
  match_reasons?: string[];
  status: ApplicationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  user?: User;
  project?: Project;
}

/* ---- Membership ---- */

export interface Membership {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  charter_version_accepted?: number;
  joined_at: string;
  left_at?: string;
  status: MembershipStatus;
  user?: User;
}

/* ---- Charter ---- */

export interface Charter {
  id: string;
  project_id: string;
  version: number;
  content: CharterContent;
  created_by: string;
  created_at: string;
  status: 'draft' | 'active' | 'superseded';
}

export interface CharterContent {
  engagement_model: EngagementModel;
  rewards: string;
  scope: string;
  milestones: string;
  deliverables: string;
  acceptance_criteria: string;
  roles: string;
  eligibility: string;
  time_commitment: string;
  ip_ownership: string;
  publication_rules: string;
  authorship: string;
  confidentiality: string;
  permitted_ai_tools: string;
  credit_split: string;
  exit_rules: string;
  dispute_rules: string;
  commercialization: string;
}

/* ---- Milestone ---- */

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  deliverables: string[];
  acceptance_criteria: string;
  budget_allocation: number;
  due_date: string;
  status: MilestoneStatus;
  reviewed_by?: string;
  completed_at?: string;
}

/* ---- Task ---- */

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string;
  title: string;
  description: string;
  assigned_to?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

/* ---- AI ---- */

export interface AIAgent {
  id: string;
  project_id: string;
  agent_type: AgentType;
  name: string;
  permissions: Record<string, boolean>;
  human_owner_id: string;
  status: 'active' | 'inactive';
}

export interface AILog {
  id: string;
  agent_id: string;
  project_id: string;
  human_owner_id: string;
  agent_type: AgentType;
  request: string;
  response: string;
  model: string;
  provider: string;
  data_sensitivity: SensitivityLevel;
  input_scope: string;
  approval_status: ApprovalStatus;
  approved_by?: string;
  fallback_used: boolean;
  fallback_reason?: string;
  created_at: string;
}

/* ---- Contribution ---- */

export interface Contribution {
  id: string;
  project_id: string;
  contributor_id: string;
  role: string;
  type: ContributionType;
  description: string;
  artifact_url?: string;
  ai_involvement: AIInvolvement;
  ai_agent_id?: string;
  human_owner_id?: string;
  reviewer_id?: string;
  status: ApprovalStatus;
  credits_awarded: number;
  created_at: string;
  contributor?: User;
}

/* ---- Ledger ---- */

export interface LedgerEntry {
  id: number;
  project_id: string;
  actor_id: string;
  actor_type: 'human' | 'ai_agent' | 'system';
  action: string;
  contribution_id?: string;
  content_hash: string;
  previous_hash: string;
  entry_hash: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/* ---- Credit ---- */

export interface Credit {
  id: string;
  user_id: string;
  project_id: string;
  contribution_id?: string;
  amount: number;
  reason: string;
  awarded_by?: string;
  created_at: string;
}

/* ---- Escrow ---- */

export interface Escrow {
  id: string;
  project_id: string;
  milestone_id: string;
  total_amount: number;
  platform_fee: number;
  ai_compute_reserve: number;
  expert_allocation: number;
  contributor_pool: number;
  status: 'pending' | 'funded' | 'released' | 'disputed';
  funded_at?: string;
  released_at?: string;
}

/* ---- Rating ---- */

export interface Rating {
  id: string;
  project_id: string;
  rater_id: string;
  rated_id: string;
  rated_entity_type: 'user' | 'organization';
  dimensions: RatingDimensions;
  overall: number;
  comment?: string;
  created_at: string;
}

export interface RatingDimensions {
  quality: number;
  communication: number;
  reliability: number;
  fairness: number;
  professionalism: number;
}

/* ---- Dispute ---- */

export interface Dispute {
  id: string;
  project_id: string;
  raised_by: string;
  against: string;
  type: string;
  description: string;
  evidence?: Record<string, unknown>;
  status: DisputeStatus;
  resolved_by?: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

/* ---- Navigation ---- */

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  section?: string;
}
