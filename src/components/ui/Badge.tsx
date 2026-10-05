import React from 'react';

type BadgeVariant = 'verified' | 'pending' | 'danger' | 'info' | 'neutral' | 'confidential' | 'funded' | 'knowledge';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({ variant = 'neutral', children, className = '', icon }: BadgeProps) {
  return (
    <span
      className={`badge-${variant} inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

// Prebuilt status badges
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    verified: { variant: 'verified', label: 'VERIFIED' },
    approved: { variant: 'verified', label: 'APPROVED' },
    accepted: { variant: 'verified', label: 'ACCEPTED' },
    completed: { variant: 'verified', label: 'COMPLETED' },
    active: { variant: 'info', label: 'ACTIVE' },
    open: { variant: 'info', label: 'OPEN' },
    in_progress: { variant: 'info', label: 'IN PROGRESS' },
    pending: { variant: 'pending', label: 'PENDING' },
    review: { variant: 'pending', label: 'REVIEW' },
    pending_review: { variant: 'pending', label: 'PENDING REVIEW' },
    rejected: { variant: 'danger', label: 'REJECTED' },
    failed: { variant: 'danger', label: 'FAILED' },
    draft: { variant: 'neutral', label: 'DRAFT' },
    archived: { variant: 'neutral', label: 'ARCHIVED' },
    paused: { variant: 'neutral', label: 'PAUSED' },
    confidential: { variant: 'confidential', label: 'CONFIDENTIAL' },
    simulated: { variant: 'pending', label: 'SIMULATED' },
  };

  const c = config[status] || { variant: 'neutral' as BadgeVariant, label: status.toUpperCase() };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export function EngagementBadge({ model }: { model: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    funded: { variant: 'funded', label: 'FUNDED' },
    stipend: { variant: 'funded', label: 'STIPEND' },
    knowledge_sharing: { variant: 'knowledge', label: 'NON-MONETARY' },
    institutional_credit: { variant: 'knowledge', label: 'INSTITUTIONAL CREDIT' },
  };

  const c = config[model] || { variant: 'neutral' as BadgeVariant, label: model.toUpperCase() };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export function SensitivityBadge({ level }: { level: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    low: { variant: 'verified', label: 'LOW' },
    medium: { variant: 'pending', label: 'MEDIUM' },
    high: { variant: 'danger', label: 'HIGH' },
    critical: { variant: 'confidential', label: 'CRITICAL' },
  };

  const c = config[level] || { variant: 'neutral' as BadgeVariant, label: level.toUpperCase() };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
