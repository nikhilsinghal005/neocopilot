import React, { useState } from 'react';
import { useChatContext } from '../features/chat/state/ChatContext';
import { Brain, Info, X, ChevronDown, ChevronUp, Plug, SlidersHorizontal } from 'lucide-react'; // Import new icons

const Settings: React.FC = () => {
  const { setCurrentView } = useChatContext();
  const [expandedCard, setExpandedCard] = useState<'models' | 'about' | 'integrations' | 'preferences' | null>('models'); // Allow more cards

  const toggleCard = (cardName: 'models' | 'about' | 'integrations' | 'preferences') => {
    setExpandedCard(prev => (prev === cardName ? null : cardName));
  };

  const Card: React.FC<{
    title: string;
    icon: React.ReactNode;
    description: string;
    name: 'models' | 'about' | 'integrations' | 'preferences';
    children: React.ReactNode;
  }> = ({ title, icon, description, name, children }) => {
    const isExpanded = expandedCard === name;
    return (
      <div
        className={`bg-[var(--vscode-editorWidget-background)] border border-[var(--vscode-editorWidget-border)] rounded-lg shadow-md mb-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-screen' : 'max-h-24'
        }`}
      >
        <button
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--vscode-toolbar-hoverBackground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
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
        </button>
        <div
          id={`${name}-content`}
          className={`px-4 pb-4 pt-2 ${isExpanded ? 'block' : 'hidden'}`}
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
        <button
          className="p-2 rounded-md hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-toolbar-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
          onClick={() => setCurrentView('chat')}
          title="Close Settings"
          aria-label="Close Settings"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Content Area - Dashboard */}
      <div className="flex-1 p-6 overflow-auto">
        <Card
          title="Models"
          icon={<Brain size={20} className="text-[var(--vscode-editor-foreground)]" />}
          description="Configure the AI models used for chat interactions and code generation."
          name="models"
        >
          <div className="mb-6">
            <label htmlFor="model-select" className="block text-[var(--vscode-editor-foreground)] text-sm font-semibold mb-2">
              Choose a model:
            </label>
            <select
              name="models"
              id="model-select"
              className="w-full p-2 rounded-md bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] text-[var(--vscode-input-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3">Claude 3</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
          </div>
          <p className="text-[var(--vscode-editor-foreground)] text-sm">
            Select your preferred AI model for chat interactions. This setting will influence the responses you receive.
          </p>
        </Card>

        <Card
          title="Integrations"
          icon={<Plug size={20} className="text-[var(--vscode-editor-foreground)]" />}
          description="Manage connections to external services and databases, such as vector databases."
          name="integrations"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-[var(--vscode-editor-foreground)]">Vector Database Connection</h3>
            <input
              type="text"
              placeholder="Enter connection string or API key"
              className="w-full p-2 rounded-md bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] text-[var(--vscode-input-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
            />
            <button className="mt-3 py-2 px-4 rounded-md bg-[var(--vscode-button-background)] hover:bg-[var(--vscode-button-hoverBackground)] text-[var(--vscode-button-foreground)]">
              Connect
            </button>
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
            <select
              name="theme-select"
              id="theme-select"
              className="w-full p-2 rounded-md bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] text-[var(--vscode-input-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-[var(--vscode-editor-foreground)]">Notifications</h3>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="form-checkbox h-5 w-5 text-[var(--vscode-button-background)]" defaultChecked />
              <span className="ml-2 text-[var(--vscode-editor-foreground)]">Enable desktop notifications</span>
            </label>
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