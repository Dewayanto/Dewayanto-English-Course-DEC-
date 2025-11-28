import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ProficiencyLevel, Message, AgentStatus } from './types';
import { SYSTEM_PROMPTS } from './constants';
import LevelSelector from './components/LevelSelector';
import ConversationView from './components/ConversationView';
import { startEchoSession } from './services/geminiService';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData } from './utils/audioUtils';

// Polyfill for webkitAudioContext
// FIX: Cast window to any to access vendor-prefixed webkitAudioContext
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export default function App() {
  const [level, setLevel] = useState<ProficiencyLevel | null>(null);
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.SELECT_LEVEL);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  useEffect(() => {
    // Cleanup audio contexts and streams on component unmount
    return () => {
      sessionRef.current?.close();
      if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
      }
    };
  }, []);

  const handleLevelSelect = (selectedLevel: ProficiencyLevel) => {
    setLevel(selectedLevel);
    setStatus(AgentStatus.IDLE);
    setTranscript([
      { sender: 'dewa', text: "Hello! Welcome to your English practice session. I'm DEWA. Ready to start? Click the microphone button below." }
    ]);
  };

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      currentInputTranscriptionRef.current += text;
      
      setTranscript(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'user') {
          const newTranscript = [...prev];
          newTranscript[newTranscript.length - 1] = { ...lastMessage, text: currentInputTranscriptionRef.current };
          return newTranscript;
        }
        return [...prev, { sender: 'user', text: currentInputTranscriptionRef.current }];
      });
    }

    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      currentOutputTranscriptionRef.current += text;
       setStatus(AgentStatus.SPEAKING);

       setTranscript(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'dewa') {
          const newTranscript = [...prev];
          newTranscript[newTranscript.length - 1] = { ...lastMessage, text: currentOutputTranscriptionRef.current };
          return newTranscript;
        }
        return [...prev, { sender: 'dewa', text: currentOutputTranscriptionRef.current }];
      });
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current) {
      setStatus(AgentStatus.SPEAKING);
      const audioContext = outputAudioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
      
      try {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.addEventListener('ended', () => {
          audioSourcesRef.current.delete(source);
          if (audioSourcesRef.current.size === 0) {
            setStatus(AgentStatus.LISTENING);
          }
        });
        
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        audioSourcesRef.current.add(source);
      } catch (e) {
        console.error("Error decoding or playing audio:", e);
        setError("There was an issue playing back the audio.");
        setStatus(AgentStatus.ERROR);
      }
    }

    if (message.serverContent?.turnComplete) {
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';
    }
    
    const interrupted = message.serverContent?.interrupted;
    if (interrupted) {
      for (const source of audioSourcesRef.current.values()) {
        source.stop();
      }
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      setStatus(AgentStatus.LISTENING);
    }

  }, []);

  const handleError = useCallback((e: ErrorEvent) => {
    console.error("Session error:", e);
    setError("A connection error occurred. Please try again.");
    setStatus(AgentStatus.ERROR);
  }, []);

  const handleClose = useCallback(() => {
    console.log("Session closed.");
    if(status !== AgentStatus.IDLE) { // Only reset if not intentionally stopped
       setStatus(AgentStatus.IDLE);
    }
  }, [status]);

  const startConversation = async () => {
    if (!level) return;
    setError(null);
    setStatus(AgentStatus.CONNECTING);

    if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    try {
      const session = await startEchoSession({
        systemInstruction: SYSTEM_PROMPTS[level],
        callbacks: {
          onopen: () => setStatus(AgentStatus.LISTENING),
          onmessage: handleMessage,
          onerror: handleError,
          onclose: handleClose,
        },
      });
      sessionRef.current = session;
    } catch (e) {
      console.error("Failed to start session:", e);
      setError("Could not get microphone permissions or start the session.");
      setStatus(AgentStatus.ERROR);
    }
  };

  const stopConversation = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    
    for (const source of audioSourcesRef.current.values()) {
        source.stop();
    }
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setStatus(AgentStatus.IDLE);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl h-[90vh] bg-gray-800 rounded-2xl shadow-2xl flex flex-col">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">DEWAYANTO COURSE</h1>
          <div className="text-sm text-gray-400">
            {level ? `Level: ${level}` : 'AI English Tutor'}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          {!level ? (
            <LevelSelector onSelectLevel={handleLevelSelect} />
          ) : (
            <ConversationView 
              transcript={transcript} 
              status={status}
              error={error}
              onStart={startConversation}
              onStop={stopConversation}
            />
          )}
        </main>
      </div>
    </div>
  );
}