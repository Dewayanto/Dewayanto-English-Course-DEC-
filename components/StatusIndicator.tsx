import React from 'react';
import { AgentStatus } from '../types';

interface StatusIndicatorProps {
  status: AgentStatus;
  error: string | null;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, error }) => {
  let statusText = '';
  let dotClass = '';

  switch (status) {
    case AgentStatus.IDLE:
      statusText = "Ready to start";
      dotClass = 'bg-gray-500';
      break;
    case AgentStatus.CONNECTING:
      statusText = "Connecting...";
      dotClass = 'bg-yellow-500 animate-pulse';
      break;
    case AgentStatus.LISTENING:
      statusText = "Listening...";
      dotClass = 'bg-green-500 animate-pulse';
      break;
    case AgentStatus.SPEAKING:
      statusText = "DEWA is speaking...";
      dotClass = 'bg-cyan-500 animate-pulse';
      break;
    case AgentStatus.ERROR:
      statusText = error || "An error occurred";
      dotClass = 'bg-red-500';
      break;
    case AgentStatus.SELECT_LEVEL:
        statusText = "Please select a level to begin.";
        dotClass = 'bg-gray-500';
        break;
    default:
      statusText = "Idle";
      dotClass = 'bg-gray-500';
  }

  return (
    <div className="flex items-center justify-center text-center h-6">
      {status === AgentStatus.ERROR ? (
        <p className="text-red-400 text-sm">{statusText}</p>
      ) : (
        <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full transition-colors ${dotClass}`}></div>
            <p className="text-gray-400 text-sm">{statusText}</p>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;