import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useChatContext } from '../features/chat/state/ChatContext';
import { Info, X, ChevronDown, ChevronUp, Settings as SettingsIcon, Search } from 'lucide-react';
import ApiConfiguration from '../features/settings/components/ApiConfiguration';
import SettingsNavigation from '../features/settings/components/SettingsNavigation';
import usePersistentState from '../features/settings/components/hooks/usePersistentState';
import { useSettings } from '../features/settings/state/SettingsContext';

const Settings: React.FC = () => {
  const { setCurrentView } = useChatContext();
  const { activeProvider, configs } = useSettings();
  const [expandedCard, setExpandedCard] = usePersistentState<'api' | 'integrations' | 'preferences' | 'about' | null>('settings.expandedCard', 'api');
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleCard = (cardName: 'api' | 'integrations' | 'preferences' | 'about') => {
    setExpandedCard(prev => (prev === cardName ? null : cardName));
  };

  const onSelectSection = useCallback((id: string) => {
    if (id === expandedCard) {return;}
    setExpandedCard(id as 'api' | 'integrations' | 'preferences' | 'about');
    requestAnimationFrame(() => {
      const el = document.getElementById(`${id}-card-anchor`);
      if (el && containerRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [expandedCard, setExpandedCard]);

  const searchMatcher = useMemo(() => query.trim().toLowerCase(), [query]);

  const Card: React.FC<{
    title: string;
    icon: React.ReactNode;
    description: string;
    name: 'api' | 'integrations' | 'preferences' | 'about';
    children: React.ReactNode;
  }> = ({ title, icon, description, name, children }) => {
    const isExpanded = expandedCard === name;
    const haystack = (title + ' ' + description).toLowerCase();
    if (searchMatcher && !haystack.includes(searchMatcher)) {return null;}
    return (
      <section id={`${name}-card-anchor`} className="group rounded-md border border-[var(--vscode-editorWidget-border)] bg-[var(--vscode-editorWidget-background)] shadow-sm mb-5 focus-within:border-[var(--vscode-focusBorder)] transition-colors">
        <header className="flex items-stretch">
          <button type="button" onClick={() => toggleCard(name)} aria-expanded={isExpanded} aria-controls={`${name}-content`} className="flex-1 text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--vscode-toolbar-hoverBackground)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]">
            <span className="opacity-90 group-hover:opacity-100 transition-opacity">{icon}</span>
            <span className="flex-1 font-semibold tracking-wide text-[var(--vscode-editor-foreground)]">{title}</span>
            {isExpanded ? (<ChevronUp size={16} className="text-[var(--vscode-editor-foreground)] opacity-70" />) : (<ChevronDown size={16} className="text-[var(--vscode-editor-foreground)] opacity-70" />)}
          </button>
        </header>
        {isExpanded && (
          <div id={`${name}-content`} className="px-5 pb-6 pt-1 border-t border-[var(--vscode-editorWidget-border)] animate-fadeIn">
            <p className="text-xs mb-4 text-[var(--vscode-descriptionForeground)] leading-relaxed max-w-prose">{description}</p>
            {children}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--vscode-sideBar-background)] text-[var(--vscode-sideBar-foreground)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--vscode-editorGroup-border)]">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-wide text-[var(--vscode-editor-foreground)]">Settings</h1>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]">Neo Copilot</span>
        </div>
        <button onClick={() => setCurrentView('chat')} className="p-1 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]" aria-label="Close Settings">
          <X size={16} />
        </button>
      </div>

      <div ref={containerRef} className="flex-1 px-1 py-6 overflow-auto settings-scroll">
        <div className="mx-auto w-full max-w-[1024px] space-y-6">
          <div className="flex flex-col gap-4 sticky top-0 z-10 pb-3 bg-[var(--vscode-sideBar-background)]/95 backdrop-blur border-b border-[var(--vscode-editorWidget-border)] mb-2">
            <SettingsNavigation sections={[{ id: 'api', label: 'API' }, { id: 'about', label: 'About' }]} active={expandedCard} onSelect={onSelectSection} />
            <div className="relative w-full md:w-1/2">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70" />
              <input type="text" placeholder="Search settings…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-7 pr-2 py-1.5 rounded text-xs bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] focus:outline-none focus:ring-1 focus:ring-[var(--vscode-focusBorder)]" aria-label="Search settings" />
            </div>
          </div>

          <Card title="API Configuration" icon={<SettingsIcon size={20} className="text-[var(--vscode-editor-foreground)]" />} description="Configure the API settings for connecting to AI models." name="api">
            <ApiConfiguration />
          </Card>

          <Card title="About" icon={<Info size={20} className="text-[var(--vscode-editor-foreground)]" />} description="Information about Neo Copilot, its version, and licensing details." name="about">
            <div className="space-y-4">
              <p className="text-[var(--vscode-editor-foreground)] text-base leading-relaxed">Neo Copilot is an AI-powered assistant designed to enhance your coding workflow. It provides intelligent code suggestions, helps with debugging, and offers contextual insights.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="rounded border border-[var(--vscode-editorWidget-border)] p-3 bg-[var(--vscode-editorWidget-background)]">
                  <h3 className="font-semibold mb-1">Active Provider</h3>
                  <p className="opacity-80">{activeProvider}</p>
                </div>
                <div className="rounded border border-[var(--vscode-editorWidget-border)] p-3 bg-[var(--vscode-editorWidget-background)]">
                  <h3 className="font-semibold mb-1">Model</h3>
                  <p className="opacity-80">{configs[activeProvider].modelId || '—'}</p>
                </div>
                <div className="rounded border border-[var(--vscode-editorWidget-border)] p-3 bg-[var(--vscode-editorWidget-background)]">
                  <h3 className="font-semibold mb-1">Version</h3>
                  <p className="opacity-80">1.0.0</p>
                </div>
              </div>
              <p className="text-[var(--vscode-descriptionForeground)] text-[10px] leading-relaxed">© {new Date().getFullYear()} Neo Copilot. All rights reserved. Licensed under the project license.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;