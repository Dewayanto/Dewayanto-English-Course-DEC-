
import React from 'react';
import { AgentStatus } from '../types';

interface MicButtonProps {
    status: AgentStatus;
    onStart: () => void;
    onStop: () => void;
}

const MicIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" />
    </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);


const MicButton: React.FC<MicButtonProps> = ({ status, onStart, onStop }) => {
    const isConversing = status === AgentStatus.LISTENING || status === AgentStatus.SPEAKING || status === AgentStatus.CONNECTING;
    const isDisabled = status === AgentStatus.CONNECTING || status === AgentStatus.SPEAKING;

    const handleClick = () => {
        if (isConversing) {
            onStop();
        } else {
            onStart();
        }
    };

    let ringClass = '';
    if (status === AgentStatus.LISTENING) {
        ringClass = 'ring-green-500 animate-pulse';
    } else if (status === AgentStatus.SPEAKING) {
        ringClass = 'ring-cyan-500 animate-pulse';
    } else {
        ringClass = 'ring-gray-600';
    }
    
    const baseClasses = "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    const activeClasses = isConversing ? "bg-red-600 hover:bg-red-700" : "bg-cyan-600 hover:bg-cyan-700";
    const ringClasses = `ring-4 ${ringClass}`;

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`${baseClasses} ${activeClasses} ${ringClasses}`}
            aria-label={isConversing ? 'Stop conversation' : 'Start conversation'}
        >
            {isConversing ? <StopIcon /> : <MicIcon />}
        </button>
    );
};

export default MicButton;
