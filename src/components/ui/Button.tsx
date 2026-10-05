import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] border-transparent',
  secondary: 'bg-white text-[#334155] hover:bg-[#F1F5F9] border-[#E2E8F0]',
  ghost: 'bg-transparent text-[#475569] hover:bg-[#F1F5F9] border-transparent',
  danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B] border-transparent',
  success: 'bg-[#15803D] text-white hover:bg-[#166534] border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        rounded-lg border transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : icon}
      {children}
    </button>
  );
}
