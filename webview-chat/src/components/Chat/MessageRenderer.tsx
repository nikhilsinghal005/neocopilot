import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypePrism from 'rehype-prism-plus';
import './prism-nord.css';
import './custom-overrides.css';
import remarkGfm from 'remark-gfm';
import CodeButton from '../Common/CodeButton';
import { useVscode } from '../../context/VscodeContext';

interface MessageRendererProps {
  text: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ text }) => {
  const vscode = useVscode();

  const handleInsertToEditorTerminal = (code: string, location: string) => {
    console.log("VS Code API in ChatControls:", vscode);
    vscode.postMessage({
      command: 'insertCodeSnippet',
      data: {
        code,
        location,
      },
    });
  };

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
  
        const handleCopyClick = () => {
          handleCopyToClipboard(codeContent);
        };
  
        const handleInsertClick = () => {
          console.log('Insert action clicked for:', codeContent);
          handleInsertToEditorTerminal(codeContent, 'editor');
        };
  
        const handleTButtonClick = () => {
          handleInsertToEditorTerminal(codeContent, 'terminal');
        };
  
        return (
          <div className="my-4 p-0">
            {/* Header for the code block with language label and copy/insert buttons */}
            <div className="flex justify-between items-center bg-gray-900 text-gray-100 px-4 py-1 rounded-t-md">
              <span className="text-xs font-semibold uppercase">{language}</span>
              <div className="flex">
                {language === 'bash' ? (
                  // Render "T" button for Bash language
                  <CodeButton
                    onClick={handleTButtonClick}
                    ariaLabel="Custom T action"
                    icon="codicon-terminal"
                  />
                ) : (
                  // Render Insert button for other languages
                  <CodeButton
                    onClick={handleInsertClick}
                    ariaLabel="Insert code"
                    icon="codicon-arrow-right"
                  />
                )}
                {/* Reusable CodeButton for Copy */}
                <CodeButton
                  onClick={handleCopyClick}
                  ariaLabel="Copy code to clipboard"
                  icon="codicon-copy"
                />
              </div>
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
      return <div>Error rendering code block</div>;
    }
  };

  return (
    <div className="prose max-w-full text-sm leading-6 space-y-4"> {/* Updated styling to improve aesthetics */}
      <ReactMarkdown
        children={text}
        // skipHtml={true}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypePrism, { ignoreMissing: true }],
        ]}
        components={{
          code: renderCodeBlock,
          p: ({ node, children }) => (
            <p className="text-gray-200 my-2 leading-relaxed"> {/* Added styling for paragraphs */}
              {children}
            </p>
          ),
          blockquote: ({ node, children }) => (
            <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-400 my-4"> {/* Styled blockquotes for emphasis */}
              {children}
            </blockquote>
          ),
          a: ({ node, href, children }) => (
            <a
              href={href}
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ node, children }) => (
            <ul className="list-disc list-inside pl-4 text-gray-200 my-2"> {/* Styled unordered lists */}
              {children}
            </ul>
          ),
          ol: ({ node, children }) => (
            <ol className="list-decimal list-outside pl-6 ml-2 text-gray-200 my-2"> {/* Adjusted ordered list marker position to align correctly */}
              {children}
            </ol>
          ),
          strong: ({ node, children }) => (
            <strong className="text-gray-100 font-semibold">{/* Styling for bold text */}
              {children}
            </strong>
          ),
          em: ({ node, children }) => (
            <em className="text-gray-300 italic">{/* Styling for italic text */}
              {children}
            </em>
          ),
        }}
      />
    </div>
  );
};

export default MessageRenderer;
