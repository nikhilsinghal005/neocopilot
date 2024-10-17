import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypePrism from 'rehype-prism-plus';
import 'prismjs/themes/prism-tomorrow.css';
import './custom-overrides.css';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import '@vscode/codicons/dist/codicon.css';
import remarkGfm from 'remark-gfm';

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

  const handleCopyToClipboard = (code: string) => {
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
    try {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : null;

      // Handle inline code (surrounded by single backticks)
      if (inline) {
        return (
          <code
            className={`bg-gray-800 rounded px-1 py-0.5 text-gray-300 ${className}`}
            {...props}
          >
            {children}
          </code>
        );
      }

      // Handle block code (surrounded by triple backticks)
      if (language) {
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
              <span className="text-xs font-semibold uppercase">{language}</span>
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
                <code className={`${className} block p-4 text-gray-300`} {...props}>
                  {children}
                </code>
              </pre>
            </div>
          </div>
        );
      }

      // If no language detected and not inline, treat it as regular text
      return <span>{children}</span>;

    } catch (error) {
      console.log('Error rendering Markdown: ', error);
      console.error('Error rendering Markdown', error);
      return <div>Error rendering code block</div>;
    }
  };

  return (
    <div className="prose max-w-full text-sm leading-6">
      <ReactMarkdown
        children={text}
        // skipHtml={true}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypePrism, { ignoreMissing: true }],
        ]}
        components={{
          code: renderCodeBlock,
        }}
      />
    </div>
  );
};

export default MessageRenderer;
