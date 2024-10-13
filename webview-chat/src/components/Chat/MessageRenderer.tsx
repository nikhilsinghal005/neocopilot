import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypePrism from 'rehype-prism-plus';
import 'prismjs/themes/prism-tomorrow.css';
import './custom-overrides.css';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import '@vscode/codicons/dist/codicon.css';

interface MessageRendererProps {
  text: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any; // To accept any additional props
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ text }) => {
  // Function to check if the text contains code blocks
  const containsCodeBlock = (markdownText: string): boolean => {
    const codeBlockRegex = /```[\s\S]*?```/;
    return codeBlockRegex.test(markdownText);
  };

  const handleCopyToClipboard = (code: string) => {
    console.log('Code to copy:', code);
    navigator.clipboard
      .writeText(code)
      .then(() => {
        console.log('Code copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy code: ', err);
      });
  };

  const renderCodeBlock = ({
    node,
    inline,
    className,
    children,
    ...props
  }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';

    if (!inline) {
      const extractText = (child: React.ReactNode): string => {
        if (typeof child === 'string') {
          return child;
        } else if (Array.isArray(child)) {
          return child.map(extractText).join('');
        } else if (React.isValidElement(child)) {
          const element = child as React.ReactElement<{
            children?: React.ReactNode;
          }>;
          return extractText(element.props.children);
        } else {
          return '';
        }
      };

      const codeContent = extractText(children).trim();

      const handleClick = () => {
        handleCopyToClipboard(codeContent);
      };

      return (
        <div className="my-4 p-0">
          {/* Header for the code block with language label and copy button */}
          <div className="flex justify-between items-center bg-gray-900 text-gray-100 px-4 py-2 rounded-t-md">
            <span className="text-xs font-semibold uppercase">
              {language}
            </span>
            <VSCodeButton
              onClick={handleClick}
              appearance="icon"
              aria-label="Copy code to clipboard"
            >
              <span className="codicon codicon-copy"></span>
            </VSCodeButton>
          </div>
          {/* Code snippet wrapper */}
          <div className="rounded-b-md overflow-auto bg-gray-800 !p-0 !m-0">
            <pre className="!m-0">
              <code
                className={`${className} block p-4 text-gray-300`}
                {...props}
              >
                {children}
              </code>
            </pre>
          </div>
        </div>
      );
    } else {
      return (
        <code
          className={`bg-gray-800 rounded px-1 py-0.5 text-gray-300 ${className}`}
          {...props}
        >
          {children}
        </code>
      );
    }
  };

  // Decide whether to use ReactMarkdown or just render the text
  if (!containsCodeBlock(text)) {
    // If the text doesn't contain code blocks, render it as plain text
    return <div className="prose max-w-full text-sm leading-6">{text}</div>;
  }

  // If the text contains code blocks, render as before
  return (
    <div className="prose max-w-full text-sm leading-6">
      <ReactMarkdown
        children={text}
        rehypePlugins={[rehypeRaw, rehypePrism]}
        components={{
          code: renderCodeBlock,
        }}
      />
    </div>
  );
};

export default MessageRenderer;
