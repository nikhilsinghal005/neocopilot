import React, { useState } from 'react';
import { useChatContext } from '../features/chat/state/ChatContext';
import { Info, X, ChevronDown, ChevronUp, Plug, SlidersHorizontal, Settings as SettingsIcon } from 'lucide-react'; // Import new icons
import ApiConfiguration from '../features/settings/components/ApiConfiguration';
import { VSCodeButton, VSCodeCheckbox, VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

const Settings: React.FC = () => {
  const { setCurrentView } = useChatContext();
  const [expandedCard, setExpandedCard] = useState<'api' | 'integrations' | 'preferences' | 'about' | null>('api'); // Allow more cards

  const toggleCard = (cardName: 'api' | 'integrations' | 'preferences' | 'about') => {
    setExpandedCard(prev => (prev === cardName ? null : cardName));
  };

  const Card: React.FC<{
    title: string;
    icon: React.ReactNode;
    description: string;
    name: 'api' | 'integrations' | 'preferences' | 'about';
    children: React.ReactNode;
  }> = ({ title, icon, description, name, children }) => {
    const isExpanded = expandedCard === name;
    return (
      <section
        className={`group rounded-md border border-[var(--vscode-editorWidget-border)] bg-[var(--vscode-editorWidget-background)] shadow-sm mb-5 focus-within:border-[var(--vscode-focusBorder)] transition-colors`}
      >
        <header className="flex items-stretch">
          <button
            type="button"
            onClick={() => toggleCard(name)}
            aria-expanded={isExpanded}
            aria-controls={`${name}-content`}
            className="flex-1 text-left flex items-center gap-3 px-4 py-3 hover:bg-[var(--vscode-toolbar-hoverBackground)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]"
          >
            <span className="opacity-90 group-hover:opacity-100 transition-opacity">{icon}</span>
            <span className="flex-1 font-semibold tracking-wide text-[var(--vscode-editor-foreground)]">{title}</span>
            {isExpanded ? (
              <ChevronUp size={16} className="text-[var(--vscode-editor-foreground)] opacity-70" />
            ) : (
              <ChevronDown size={16} className="text-[var(--vscode-editor-foreground)] opacity-70" />
            )}
          </button>
        </header>
        {isExpanded && (
          <div
            id={`${name}-content`}
            className="px-5 pb-6 pt-1 border-t border-[var(--vscode-editorWidget-border)] animate-fadeIn"
          >
            <p className="text-xs mb-4 text-[var(--vscode-descriptionForeground)] leading-relaxed max-w-prose">{description}</p>
            {children}
          </div>
        )}
      </section>
    );
  };

  return (
  <div className="flex flex-col h-full w-full bg-[var(--vscode-sideBar-background)] text-[var(--vscode-sideBar-foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--vscode-editorGroup-border)]">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-wide text-[var(--vscode-editor-foreground)]">Settings</h1>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]">Neo Copilot</span>
        </div>
        <button
          onClick={() => setCurrentView('chat')}
          className="p-1 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]"
          aria-label="Close Settings"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Content Area - Dashboard */}
      <div className="flex-1 px-1 py-6 overflow-auto settings-scroll">
        <div className="mx-auto w-full max-w-[1024px] space-y-2">
          <Card
            title="API Configuration"
            icon={<SettingsIcon size={20} className="text-[var(--vscode-editor-foreground)]" />}
            description="Configure the API settings for connecting to AI models."
            name="api"
          >
            <ApiConfiguration />
          </Card>

          {/**
           * Integrations section temporarily disabled per request.
           * TODO: Re-enable when integration features (vector DB, external KB) are implemented.
           */}
          {(() => { const showIntegrations = false; return showIntegrations; })() && (
            <Card
              title="Integrations"
              icon={<Plug size={20} className="text-[var(--vscode-editor-foreground)]" />}
              description="Manage connections to external services and databases, such as vector databases."
              name="integrations"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[var(--vscode-editor-foreground)]">Vector Database Connection</h3>
                <VSCodeTextField
                  type="text"
                  placeholder="Enter connection string or API key"
                  className="w-full"
                />
                <VSCodeButton className="mt-3">
                  Connect
                </VSCodeButton>
              </div>
              <p className="text-[var(--vscode-editor-foreground)] text-sm">
                Connect Neo Copilot to your external knowledge bases for enhanced context.
              </p>
            </Card>
          )}

          {/** Preferences section commented out until design finalized */}
          {(() => { const showPreferences = false; return showPreferences; })() && (
            <Card
              title="Preferences"
              icon={<SlidersHorizontal size={20} className="text-[var(--vscode-editor-foreground)]" />}
              description="Customize the behavior and appearance of Neo Copilot."
              name="preferences"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[var(--vscode-editor-foreground)]">Theme</h3>
                <VSCodeDropdown
                  name="theme-select"
                  id="theme-select"
                  className="w-full"
                >
                  <VSCodeOption value="dark">Dark</VSCodeOption>
                  <VSCodeOption value="light">Light</VSCodeOption>
                </VSCodeDropdown>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[var(--vscode-editor-foreground)]">Notifications</h3>
                <VSCodeCheckbox>Enable desktop notifications</VSCodeCheckbox>
              </div>
              <p className="text-[var(--vscode-editor-foreground)] text-sm">
                Adjust various settings to personalize your Neo Copilot experience.
              </p>
            </Card>
          )}

          <Card
            title="About"
            icon={<Info size={20} className="text-[var(--vscode-editor-foreground)]" />}
            description="Information about Neo Copilot, its version, and licensing details."
            name="about"
          >
            <p className="text-[var(--vscode-editor-foreground)] text-base leading-relaxed">
              Neo Copilot is an AI-powered assistant designed to enhance your coding workflow.
              It provides intelligent code suggestions, helps with debugging, and offers contextual insights.
            </p>
            <p className="text-[var(--vscode-editor-foreground)] text-sm mt-4">
              Version: 1.0.0 (Placeholder)
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;