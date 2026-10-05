import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#334155] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-md text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] ${
            icon ? 'pl-9' : ''
          } ${
            error ? 'border-[#EF4444]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#64748B] mt-1">{helperText}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-[#334155] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-md text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] resize-vertical ${
          error ? 'border-[#EF4444]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#64748B] mt-1">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-[#334155] mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-md text-[#0F172A] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] ${
          error ? 'border-[#EF4444]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#64748B] mt-1">{helperText}</p>}
    </div>
  );
}
