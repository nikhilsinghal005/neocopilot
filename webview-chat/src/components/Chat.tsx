// webview-chat/src/components/Chat.tsx

import React, { useState, useRef, useEffect } from 'react';
import '@vscode/codicons/dist/codicon.css';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { v4 as uuidv4 } from 'uuid';

type Message = {
  id: string;
  timestamp: string;
  messageType: 'user' | 'system';
  text: string;
};

interface ChatProps {
  vscode: {
    postMessage: (msg: any) => void;
  };
}

const Chat: React.FC<ChatProps> = ({ vscode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const accumulatedResponseRef = useRef<string>(''); // Ref to accumulate message fragments
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (input.trim() === '') return;

    const newMessage: Message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: 'user',
      text: input.trim(),
    };

    // Add the message to the state
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');
    setIsTyping(true);
    console.log("Hakuna Matata");
    
    // Send the message to the extension
    vscode.postMessage({
      command: 'send_chat_message',
      data: newMessage,
    });
  };

  // Scroll to the latest message when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming messages from the VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.command === 'receive_chat_message') {
        const { data } = event.data;
        // console.log("Chat Component: Processing 'receive_chat_message' with data:", data);

        // Accumulate the response text
        accumulatedResponseRef.current += data.response;

        // If the response is complete, add it to the chat and clear the accumulated response
        if (data.complete) {
          const receivedMessage: Message = {
            id: data.unique_id !== 'unknown' ? data.unique_id : uuidv4(),
            timestamp: new Date().toISOString(),
            messageType: 'system',
            text: accumulatedResponseRef.current, // Use the accumulated response
          };

          // Update the state to add the received message
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
          accumulatedResponseRef.current = ''; // Clear the accumulator
          setIsTyping(false); // Typing indicator off since the message is complete
        }
      } else {
        console.log("Chat Component: Received unknown command:", event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    console.log("Chat Component: Added message event listener");

    // Clean up event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array to add the listener only once

  return (
    <div className="chat-container flex flex-col h-full w-full p-0 bg-vscode-editor-background text-vscode-editor-foreground">
      {/* Messages Container */}
      <div className="messages-container flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message flex ${
              message.messageType === 'user' ? 'justify-end' : 'justify-start'
            } items-start mb-3`}
          >
            {message.messageType !== 'user' && (
              <span className="codicon codicon-person text-gray-400 mr-2"></span>
            )}
            <div
              className={`p-3 rounded-lg max-w-full break-words shadow-md ${
                message.messageType === 'user'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              <span className="block text-xs font-semibold mb-1 opacity-75">
                {message.messageType === 'user' ? 'You' : 'LLM'} ·{' '}
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>{message.text}</span>
            </div>
            {message.messageType === 'user' && (
              <span className="codicon codicon-check text-gray-400 ml-2"></span>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="message flex justify-start mb-3">
            <span className="codicon codicon-person text-gray-400 mr-2"></span>
            <div className="p-3 rounded-lg max-w-full break-words shadow-md bg-gray-800 text-gray-200">
              <span className="block text-xs font-semibold mb-1 opacity-75">
                LLM ·{' '}
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex space-x-2">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-200"></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-400"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Bar */}
      <div className="input-container absolute bottom-4 left-4 right-4 flex items-center gap-2">
        <div className="relative w-full">
          {/* Input Box */}
          <input
            type="text"
            className="w-full h-12 px-4 pr-12 bg-gray-900 text-gray-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 shadow-lg rounded-full"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          {/* Send Button Overlapping Input Box */}
          <VSCodeButton
            onClick={handleSendMessage}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 p-0 rounded-full bg-gray-700 hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 shadow-lg flex items-center justify-center"
            appearance="icon"
            aria-label="Send Message"
          >
            <span className="codicon codicon-send text-white text-lg"></span>{' '}
            {/* Send icon */}
          </VSCodeButton>
        </div>
      </div>
    </div>
  );
};

export default Chat;
