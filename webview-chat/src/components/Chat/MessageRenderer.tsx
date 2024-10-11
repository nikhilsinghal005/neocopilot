import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypePrism from 'rehype-prism-plus';
import 'prismjs/themes/prism-tomorrow.css';

interface MessageRendererProps {
  text: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ text }) => {
  return (
    <div className="prose max-w-full text-sm leading-6">
      <ReactMarkdown
        children={text}
        rehypePlugins={[rehypeRaw, rehypePrism]}
      />
    </div>
  );
};

export default MessageRenderer;
