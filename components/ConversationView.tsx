
import React, { useEffect, useRef } from 'react';
import { Message as MessageType, AgentStatus } from '../types';
import Message from './Message';
import StatusIndicator from './StatusIndicator';
import MicButton from './MicButton';

interface ConversationViewProps {
  transcript: MessageType[];
  status: AgentStatus;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({ transcript, status, error, onStart, onStop }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4">
        {transcript.map((msg, index) => (
          <Message key={index} sender={msg.sender} text={msg.text} />
        ))}
      </div>
      <div className="p-4 border-t border-gray-700 flex flex-col items-center justify-center">
        <StatusIndicator status={status} error={error} />
        <div className="mt-4">
          <MicButton status={status} onStart={onStart} onStop={onStop} />
        </div>
      </div>
    </div>
  );
};

export default ConversationView;
