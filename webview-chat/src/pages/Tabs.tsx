import React, { useState } from 'react';
import ChatControls from '../components/Chat/ChatControls';

interface TabProps {
  tabs: Array<{
    label: string;
    content: React.ReactNode;
  }>;
}

const Tabs: React.FC<TabProps> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(0);
    const isChatTabActive = tabs[activeTab]?.label === 'Chat';
    return (
      <div className="w-full h-full flex flex-col bg-vscode-editor-background">
        {/* Fixed Tab Header */}
        <div className="fixed top-0 left-0 right-0 z-10 flex justify-between border-b border-gray-600 bg-vscode-editor-background text-vscode-editor-foreground">
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={index}
                className={`px-4 py-2 focus:outline-none ${
                  index === activeTab
                    ? 'border-b-2 border-blue-400 text-white font-semibold'
                    : 'hover:text-white'
                }`}
                onClick={() => setActiveTab(index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
  
          {/* Conditional Buttons (shown only on Chat tab) */}
          {isChatTabActive && <ChatControls />}
        </div>

        {/* Render all tab content but hide inactive ones */}
        <div className="flex-grow overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground">
          {tabs.map((tab, index) => (
            <div
              key={index}
              className={`mt-[40px] ${
                index === activeTab ? 'block' : 'hidden'
              }`} // Control visibility instead of unmounting
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    );
  };

  export default Tabs;
