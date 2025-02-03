import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypePrism from 'rehype-prism-plus';
import '../../themes/prism-tomorrow.css';
import './custom-overrides.css';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { CurrentFileContext,UploadedImage } from '../../types/CoworkerMessage';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import LanguageIcon from '../Common/LanguageIcon';
import { Image } from "lucide-react"

interface MessageRendererProps {
  text: string;
  type: string;
  attachedContext: CurrentFileContext[]
  uploadedImage: UploadedImage[];
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode; // Make `children` optional
  [key: string]: any;  // Allow other arbitrary props
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ text, type, attachedContext, uploadedImage = [] }) => {
  // Define custom components for rendering specific markdown elements

  const getFileName = (relativePath: string): string => {
    try {
      // Replace backslashes with forward slashes for consistency
      const normalizedPath = relativePath.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      return parts.pop() || '';
    } catch (error) {
      return "";
    }
  }

  const getParams = (str: string): string => {
    try {
      const query = new URLSearchParams(str);
      return query.get('file_name') || ""
    } catch (error) {
      return "";
    }
  };

  const components: Components = {
    code({ inline, className, children, ...props }: CodeProps) {
      // Check if the code is an actual code block (block-level with a language class)
      if (!inline && className && className.startsWith('language-')) {

        const dataSource = props.node?.data?.meta ?? "";
        const relativePath = getParams(dataSource.trim())

        let fileName : string = ""
        if (relativePath) {
          fileName = getFileName(relativePath)
        }

        console.log(relativePath)
        console.log(fileName)
        return (
          <CodeBlock
            inline={inline}
            className={className}
            codeContent={children}
            fileName={fileName}
            relativePath={relativePath}
            {...props}
          />
        );
      } else if (inline) {
        // Render inline code as simple `<code>` with styling
        return (
          <code
            className="bg-vscode-editor-background rounded px-1 py-0.5 text-vscode-editor-foreground"
            {...props}
          >
            {children}
          </code>
        );
      } else {
        // Fallback for cases that are neither inline nor have a language class
        return <span>{children}</span>;
      }
    },
    p: ({ children }) => (
      <p className="text-vscode-editor-foreground my-2 leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-vscode-editor-background pl-4 italic text-vscode-editor-foreground my-4">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-blue-400 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside pl-4 text-vscode-editor-foreground my-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-6 ml-2 text-vscode-editor-foreground my-2">
        {children}
      </ol>
    ),
    strong: ({ children }) => (
      <strong className="text-gray-100 font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-vscode-editor-foreground italic">{children}</em>
    ),
  };

    // Render tags for attached context
    const renderAttachedContext = () => {
      const hasAttachedContext = attachedContext && attachedContext.length > 0;
      const hasUploadedImages = uploadedImage && uploadedImage.length > 0;
      if (!hasAttachedContext && !hasUploadedImages) {
        return null;
      }
    
      return (
        <div>
          <h4 className="text-xxxs font-semibold text-vscode-editor-foreground mb-0">References</h4>
          {hasAttachedContext && (
            <div className="flex items-center gap-1">
              <span className="text-xxxs font-semibold text-vscode-editor-foreground mb-0">Code:</span>
              <ul className="flex flex-wrap gap-1">
                {attachedContext.map((context, index) => (
                  <span
                    key={index}
                    className="rounded-xs pr-1 flex items-center h-5 text-xxxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--vscode-editor-background)',
                      borderColor: 'var(--vscode-editorGroup-border)',
                      color: 'var(--vscode-editor-foreground)',
                    }}
                  >
                    <LanguageIcon fileName={context.fileName || ""} iconSize={16} />
                    {context.fileName}
                  </span>
                ))}
              </ul>
            </div>
          )}
          {hasUploadedImages && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xxxs font-semibold text-vscode-editor-foreground mb-0">Files:</span>
              <ul className="flex flex-wrap gap-1">
                {uploadedImage.map((image, index) => (
                  <span
                    key={index}
                    className="rounded-xs pr-1 flex items-center h-5 text-xxxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--vscode-editor-background)',
                      borderColor: 'var(--vscode-editorGroup-border)',
                      color: 'var(--vscode-editor-foreground)',
                    }}
                  >
                    <Image size={12} className="ml-1 mr-1" />
                    {image.fileName}
                  </span>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    };
    
    if (type === 'user') {
      let bottomMargin: string = "";
      if (attachedContext.length > 0){
        bottomMargin = 'mb-2';
      }    
      return (
        <div className={`prose max-w-full text-xs leading-6 space-y-1 ${bottomMargin}`}>
          <ReactMarkdown
            children={text}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
            components={components}
          />
          {renderAttachedContext()}
        </div>
      );
    }
     else {
      return (
        <div className="prose max-w-full text-xs leading-6 space-y-2 mb-2">
          <ReactMarkdown
            children={text}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
            components={components}
          />
        </div>
      );
    }
  
  };
  
  export default MessageRenderer;
