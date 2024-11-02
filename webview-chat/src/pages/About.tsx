import React from 'react';

const About: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-start items-center bg-vscode-editor-background text-vscode-editor-foreground p-2">
      <div className="w-5/6 bg-vscode-editor-background p-2 rounded-md shadow-md">
        {/* About Section Heading */}
        <div className="text-2xl font-bold text-vscode-editor-foreground mb-4">
          Neo Mission
        </div>

        {/* About Content */}
        <p className="text-base text-vscode-editor-foreground mb-4 leading-relaxed">
          <span className="font-semibold">NeoCopilot</span> is your AI-powered coding companion, designed to help you write better code, faster. Whether you're building new applications, solving bugs, or looking for guidance in your projects, NeoCopilot is here to assist you every step of the way.
        </p>

        <p className="text-base text-vscode-editor-foreground mb-6 leading-relaxed">
          Our mission is to create a <span className="font-semibold">collaborative coding experience</span> by developing an AI that acts like a co-worker—available whenever you need advice, help with debugging, or an extra set of hands to tackle complex coding challenges. NeoCopilot is more than just an assistant; it’s a partner in code.
        </p>

        {/* Highlighted Quote */}
        <p className="italic text-lg text-vscode-input-placeholder text-center mt-8">
          “Bridging the gap between human creativity and AI assistance to bring the best out of developers.”
        </p>
      </div>
    </div>
  );
};

export default About;
