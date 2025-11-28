
import React from 'react';

interface MessageProps {
  sender: 'user' | 'echo';
  text: string;
}

const Message: React.FC<MessageProps> = ({ sender, text }) => {
  const isUser = sender === 'user';
  
  const containerClasses = isUser ? 'flex justify-end' : 'flex justify-start';
  const bubbleClasses = isUser 
    ? 'bg-cyan-600 text-white rounded-l-2xl rounded-tr-2xl' 
    : 'bg-gray-700 text-gray-200 rounded-r-2xl rounded-tl-2xl';

  return (
    <div className={`${containerClasses} animate-fade-in`}>
      <div className={`max-w-md md:max-w-lg p-3 px-4 ${bubbleClasses} shadow-md`}>
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
};

export default Message;
