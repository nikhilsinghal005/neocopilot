import React from 'react';
import ReactMarkdown from 'react-markdown';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface AboutProps {
  vscode: {
    postMessage: (msg: any) => void;
  };
}

const About: React.FC<AboutProps> = ({ vscode }) => {
  const markdownContent = `
# Neo Mission

**NeoCopilot** is your AI-powered coding companion, designed to help you write better code, faster. Whether you're building new applications, solving bugs, or looking for guidance in your projects, NeoCopilot is here to assist you every step of the way.

Our mission is to create a **collaborative coding experience** by developing an AI that acts like a co-worker—available whenever you need advice, help with debugging, or an extra set of hands to tackle complex coding challenges. NeoCopilot is more than just an assistant; it’s a partner in code.

> "Bridging the gap between human creativity and AI assistance to bring the best out of developers."
`;

  // Contact Us action handler
  const handleContactUs = () => {
    vscode.postMessage({
      command: 'contact_us',
      message: 'Please contact us at support@neocopilot.com',
    });
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center"
      style={{ 
        paddingTop: '40px'
      }}
    >
      <div className="card border rounded-xs shadow-xl p-6 overflow-hidden h-[600px]"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
          maxWidth: '450px',
          minWidth: '350px',
          width: '100%', // Ensures responsiveness
        }}
      >
        <ReactMarkdown 
          children={markdownContent} 
          components={{
            h1: ({node, ...props}) => <div className="text-2xl font-bold mb-6" {...props} style={{ color: 'var(--vscode-editor-foreground)' }} />,
            p: ({node, ...props}) => <p className="text-base leading-relaxed mb-4" {...props} style={{ color: 'var(--vscode-editor-foreground)' }} />,
            blockquote: ({node, ...props}) => (
              <blockquote 
                className="italic text-lg text-center mt-8" 
                {...props} 
                style={{ 
                  backgroundColor: 'var(--vscode-editor-background)',
                  color: 'var(--vscode-input-placeholder)' 
                }} 
              />
            )
          }}
        />

        {/* Contact Us Button */}
        <VSCodeButton
          className="contact-us-button w-full h-9 text-base mt-4"
          onClick={handleContactUs}
        >
          Contact Us
        </VSCodeButton>
      </div>
    </div>
  );
};

export default About;
