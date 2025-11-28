
import { GoogleGenAI, Modality, type LiveSession, type LiveServerMessage, type Blob } from '@google/genai';
import { encode } from '../utils/audioUtils';

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    // In a real app, you'd handle this more gracefully, but for this context, an error is fine.
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// FIX: Cast window to any to access vendor-prefixed webkitAudioContext
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

let microphoneStream: MediaStream | null = null;
let inputAudioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;

interface EchoSessionCallbacks {
  onopen: () => void;
  onmessage: (message: LiveServerMessage) => void;
  onerror: (event: ErrorEvent) => void;
  onclose: () => void;
}

interface StartEchoSessionParams {
  systemInstruction: string;
  callbacks: EchoSessionCallbacks;
}

function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function startEchoSession({ systemInstruction, callbacks }: StartEchoSessionParams): Promise<LiveSession> {
  // Ensure any previous streams are stopped
  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
  }
  if (inputAudioContext && inputAudioContext.state !== 'closed') {
    await inputAudioContext.close();
  }
  if(scriptProcessor) {
    scriptProcessor.disconnect();
  }

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: async () => {
        try {
          // Start microphone streaming
          microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          inputAudioContext = new AudioContext({ sampleRate: 16000 });
          const source = inputAudioContext.createMediaStreamSource(microphoneStream);
          scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
          
          callbacks.onopen();
        } catch (err) {
          console.error('Microphone access denied or error:', err);
          callbacks.onerror(new ErrorEvent('microphone-error', { message: 'Microphone access was denied or failed.' }));
          sessionPromise.then(s => s.close());
        }
      },
      onmessage: callbacks.onmessage,
      onerror: (e: ErrorEvent) => {
        console.error('Live session error:', e);
        callbacks.onerror(e);
      },
      onclose: (e: CloseEvent) => {
        if (microphoneStream) {
          microphoneStream.getTracks().forEach(track => track.stop());
          microphoneStream = null;
        }
        if (inputAudioContext && inputAudioContext.state !== 'closed') {
          inputAudioContext.close();
          inputAudioContext = null;
        }
        if(scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor = null;
        }
        callbacks.onclose();
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction,
    },
  });

  return sessionPromise;
}
