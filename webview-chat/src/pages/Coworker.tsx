// src/pages/Coworker.tsx
import React, { useState, useEffect } from 'react';
import CoworkerContainer from '../components/Coworker/CoworkerContainer'; // Updated to match Coworker naming
import { useCoworkerListener } from '../hooks/useCoworkerListener';
import { MessageStore } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';
import { useCoworkerContext } from '../context/CoworkerContext';
import { useVscode } from '../context/VscodeContext';

const Coworker: React.FC = () => {
  const vscode = useVscode();
  const { coworkerSession, setCoworkerSession, isTyping, setIsTyping, coworkerModel, attachedContext } = useCoworkerContext();
  const [input, setInput] = useState('');

  useEffect(() => {
    // Restore the saved coworker session from VSCode state
    const savedState = vscode.getState ? vscode.getState() || {} : {};

    const savedCoworkerSession = savedState.coworker || {
      coworkerId: uuidv4(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      coworkerName: 'Untitled Coworker',
      messages: [],
    }
    setCoworkerSession(savedCoworkerSession);
  }, [vscode, setCoworkerSession]);

  useEffect(() => {
    // Save the coworker session in VSCode state
    const currentState = vscode.getState() || {};
    vscode.setState({ ...currentState, coworker: coworkerSession });

    if (coworkerSession) {
      vscode.setState(coworkerSession);
    }
  }, [coworkerSession, vscode]);

  useCoworkerListener();

  const handleSendMessage = () => {
    if (input.trim() === '' || isTyping) return;

    const newMessageStore: MessageStore = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: 'user',
      text: input.trim(),
      modelSelected: coworkerModel,
      attachedContext: attachedContext
    };

    setCoworkerSession((prevSession) => {
      // Prevent duplicate messages based on ID
      const messageExists = prevSession.messages.some(msg => msg.id === newMessageStore.id);
      if (messageExists) return prevSession;

      const updatedMessages = [...(prevSession.messages || []), newMessageStore];
      const updatedCoworkerSession = { ...prevSession, messages: updatedMessages };

      vscode.postMessage({
        command: 'send_coworker_message',
        data: updatedCoworkerSession,
      });

      return updatedCoworkerSession;
    });

    setInput('');
    setIsTyping(true);
  };

  return (
    <div>
      <CoworkerContainer
        input={input}
        setInput={setInput}
        isTyping={isTyping}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Coworker;