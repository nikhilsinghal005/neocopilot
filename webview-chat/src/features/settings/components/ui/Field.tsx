import React from 'react';

interface FieldProps {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  error?: string;
}

/**
 * Reusable form field wrapper providing consistent layout, label association
 * and optional description / error messaging. Tailwind only; no inline styles.
 */
export const Field: React.FC<FieldProps> = ({
  id,
  label,
  description,
  required,
  children,
  className = '',
  error,
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className="text-[10px] font-semibold tracking-wide uppercase text-[var(--vscode-descriptionForeground)]"
      >
        {label}{required && <span className="text-[var(--vscode-inputValidation-errorForeground)] ml-0.5">*</span>}
      </label>
      {children}
      {description && !error && (
        <p className="text-[10px] leading-snug text-[var(--vscode-descriptionForeground)]">{description}</p>
      )}
      {error && (
        <p className="text-[10px] leading-snug text-[var(--vscode-inputValidation-errorForeground)]">{error}</p>
      )}
    </div>
  );
};

export default Field;
