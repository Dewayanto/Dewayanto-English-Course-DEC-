
import React from 'react';
import { ProficiencyLevel } from '../types';

interface LevelSelectorProps {
  onSelectLevel: (level: ProficiencyLevel) => void;
}

const LevelButton: React.FC<{level: ProficiencyLevel, title: string, description: string, onClick: (level: ProficiencyLevel) => void}> = ({ level, title, description, onClick }) => (
    <button 
        onClick={() => onClick(level)}
        className="text-left p-6 bg-gray-700 rounded-lg w-full transition-all duration-300 hover:bg-cyan-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
    >
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-300 mt-1">{description}</p>
    </button>
);

const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelectLevel }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Level</h2>
        <p className="text-gray-400">Select a proficiency level to start your practice session.</p>
      </div>
      <div className="w-full max-w-md space-y-4">
        <LevelButton 
            level={ProficiencyLevel.Beginner}
            title="Beginner (A1/A2)"
            description="For survival English and basic conversations."
            onClick={onSelectLevel}
        />
        <LevelButton 
            level={ProficiencyLevel.Intermediate}
            title="Intermediate (B1/B2)"
            description="For expressing opinions and connecting ideas."
            onClick={onSelectLevel}
        />
        <LevelButton 
            level={ProficiencyLevel.Advanced}
            title="Advanced (C1/C2)"
            description="For nuanced discussions and mastering style."
            onClick={onSelectLevel}
        />
      </div>
    </div>
  );
};

export default LevelSelector;
