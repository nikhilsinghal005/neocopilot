import React from 'react';

interface SettingsNavigationProps {
  sections: { id: string; label: string; icon?: React.ReactNode }[];
  active: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Horizontal quick-jump navigation for settings sections.
 */
export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({ sections, active, onSelect, className = '' }) => {
  return (
    <nav className={`flex flex-wrap gap-2 ${className}`} aria-label="Settings Sections">
      {sections.map(s => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`text-xs px-3 py-1.5 rounded border flex items-center gap-1 transition-colors
              ${isActive
                ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] border-[var(--vscode-button-background)]'
                : 'bg-[var(--vscode-editorWidget-background)] text-[var(--vscode-editor-foreground)] border-[var(--vscode-editorWidget-border)] hover:border-[var(--vscode-focusBorder)]'}`}
            aria-current={isActive ? 'true' : undefined}
          >
            {s.icon && <span className="opacity-80">{s.icon}</span>}
            <span>{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsNavigation;
