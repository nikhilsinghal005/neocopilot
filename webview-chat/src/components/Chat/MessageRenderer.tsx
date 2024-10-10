import React, { useEffect } from 'react';
import Prism from 'prismjs';
import { Remarkable } from 'remarkable';
import 'prismjs/themes/prism-tomorrow.css'; // Use the dark theme

// Import required languages
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
// Add more languages if necessary...

// Initialize Remarkable for markdown parsing
const md = new Remarkable({
  highlight: (str: string, lang: string) => {
    if (lang && Prism.languages[lang]) {
      try {
        return Prism.highlight(str, Prism.languages[lang], lang);
      } catch (__) {
        return ''; // Return empty string if highlighting fails
      }
    }
    return ''; // Return empty string if no language is detected
  },
});

interface MessageRendererProps {
  text: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ text }) => {
  // Render markdown to HTML using Remarkable
  const renderedContent = md.render(text);

  useEffect(() => {
    // Apply Prism highlighting to all code blocks
    Prism.highlightAll();
  }, [text]);

  return (
    <div className="prose max-w-full text-sm leading-6" dangerouslySetInnerHTML={{ __html: renderedContent }} />
  );
};

export default MessageRenderer;
