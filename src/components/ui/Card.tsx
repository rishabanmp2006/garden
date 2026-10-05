import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', interactive = false, padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-[#E2E8F0] rounded-lg
        ${paddingMap[padding]}
        ${interactive ? 'card-interactive cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold text-[#0F172A] ${className}`}>
      {children}
    </h3>
  );
}

export function StatCard({ label, value, subtitle, icon }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
