export enum ProficiencyLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export type Message = {
  sender: 'user' | 'dewa';
  text: string;
};

export enum AgentStatus {
  IDLE = 'IDLE',
  SELECT_LEVEL = 'SELECT_LEVEL',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}