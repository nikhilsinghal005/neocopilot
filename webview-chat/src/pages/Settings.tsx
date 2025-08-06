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
      <div
        className={`bg-[var(--vscode-editorWidget-background)] border border-[var(--vscode-editorWidget-border)] rounded-lg shadow-md mb-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-screen' : 'max-h-24'
        }`}
      >
        <VSCodeButton
          appearance="secondary"
          className="w-full flex items-center justify-between p-2 cursor-pointer bg-[var(--vscode-button-background)] hover:bg-[var(--vscode-button-hoverBackground)]"
          onClick={() => toggleCard(name)}
          aria-expanded={isExpanded}
          aria-controls={`${name}-content`}
        >
          <div className="flex items-center">
            {icon}
            <h2 className="text-xl font-bold ml-3 text-[var(--vscode-editor-foreground)]">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronUp size={20} className="text-[var(--vscode-editor-foreground)]" />
          ) : (
            <ChevronDown size={20} className="text-[var(--vscode-editor-foreground)]" />
          )}
        </VSCodeButton>
        <div
          id={`${name}-content`}
          className={`px-4 pb-4 pt-2 ${isExpanded ? 'block' : 'hidden'} border-t border-[var(--vscode-editorWidget-border)]`}
        >
          <p className="text-[var(--vscode-editor-foreground)] text-sm mb-4">{description}</p>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--vscode-sideBar-background)] text-[var(--vscode-sideBar-foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--vscode-editorGroup-border)]">
        <h1 className="text-2xl font-bold text-[var(--vscode-editor-foreground)]">Settings</h1>
        <VSCodeButton
          appearance="icon"
          className="p-2 rounded-md hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-toolbar-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
          onClick={() => setCurrentView('chat')}
          title="Close Settings"
          aria-label="Close Settings"
        >
          <X size={20} />
        </VSCodeButton>
      </div>

      {/* Main Content Area - Dashboard */}
      <div className="flex-1 p-6 overflow-auto">
        <Card
          title="API Configuration"
          icon={<SettingsIcon size={20} className="text-[var(--vscode-editor-foreground)]" />}
          description="Configure the API settings for connecting to AI models."
          name="api"
        >
          <ApiConfiguration />
        </Card>

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
  );
};

export default Settings;