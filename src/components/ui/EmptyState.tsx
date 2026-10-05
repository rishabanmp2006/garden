import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#334155]">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="spinner mb-3" />
      <p className="text-sm text-[#64748B]">{message}</p>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">{title}</h1>
        {description && (
          <p className="text-sm text-[#64748B] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
