import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Radio, AlertCircle } from 'lucide-react';

interface VoiceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  origin: string;
}

export const VoiceSessionModal: React.FC<VoiceSessionModalProps> = ({
  isOpen,
  onClose,
  destination,
  origin,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to connect to Live Voice API');
  const [transcript, setTranscript] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    {
      sender: 'agent',
      text: `Hello! I am your real-time Orbit Voice Agent. Speak into your microphone to discuss departure corridors, quiet hotel alternatives, or detour ideas for ${origin} → ${destination}.`,
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
  }, [isOpen]);

  const startVoiceSession = async () => {
    try {
      setStatusMessage('Connecting to Gemini 3.8 Live WebSocket...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusMessage('Live API connected! Listening for voice input...');
        startAudioCapture();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            setIsSpeaking(true);
            playAudioChunk(data.audio);
          }
          if (data.interrupted) {
            setIsSpeaking(false);
          }
          if (data.simulatedReply) {
            setTranscript((prev) => [...prev, { sender: 'agent', text: data.simulatedReply }]);
          }
          if (data.error) {
            setStatusMessage(data.error);
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        setStatusMessage('Voice session closed.');
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        setStatusMessage('WebSocket connection error. Make sure server is running.');
      };
    } catch (err: any) {
      console.error('Failed to start voice session:', err);
      setStatusMessage('Voice activation error: ' + (err?.message || 'Check microphone access'));
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsListening(true);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to 16-bit PCM Linear
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Base64 encode PCM bytes
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        wsRef.current.send(JSON.stringify({ audio: base64Audio }));
      };
    } catch (err: any) {
      console.warn('Microphone capture not permitted or failed:', err);
      setStatusMessage('Microphone access denied or unavailable. Voice input disabled.');
      setIsListening(false);
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);

      const playCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      const audioBuffer = playCtx.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      const source = playCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playCtx.destination);
      source.onended = () => {
        setIsSpeaking(false);
      };
      source.start();
    } catch (e) {
      console.warn('Error playing audio chunk:', e);
      setIsSpeaking(false);
    }
  };

  const stopVoiceSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  // Allow text test simulation if mic isn't accessible
  const handleSimulatedQuery = (text: string) => {
    setTranscript((prev) => [...prev, { sender: 'user', text }]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
    } else {
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: `Orbit Voice Agent: Received query "${text}". For your departure window, avoid 07:00–08:30 AM to cut highway idling. Rest stop at Maddur bypass recommended.`,
          },
        ]);
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] border border-[#E3D5C5] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3D5C5] bg-[#FAF3EC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2C2623] text-[#C88A3C] flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#1E1B19] text-base">Gemini Live Voice API</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-[#655D59]">Low-latency conversational voice agent</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopVoiceSession();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#655D59] hover:text-[#1E1B19] hover:bg-[#EAE0D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Audio Waveform Visualizer */}
        <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFFDF9] to-[#FAF3EC] border-b border-[#E3D5C5]">
          <div className="relative mb-6">
            {/* Glowing Pulsing Rings */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isSpeaking
                  ? 'bg-amber-400/40 animate-ping scale-150'
                  : isListening
                  ? 'bg-emerald-400/30 animate-pulse scale-125'
                  : 'bg-transparent'
              }`}
            />
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300 relative z-10 ${
                isSpeaking
                  ? 'bg-[#865302] border-[#C88A3C] text-white'
                  : isListening
                  ? 'bg-[#1E1B19] border-emerald-500 text-emerald-400'
                  : 'bg-[#2C2623] border-[#DECFC0] text-[#DECFC0]'
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="w-12 h-12 animate-bounce" />
              ) : isListening ? (
                <Mic className="w-12 h-12 animate-pulse text-emerald-400" />
              ) : (
                <MicOff className="w-12 h-12 opacity-60" />
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-sm font-bold text-[#1E1B19]">
              {isSpeaking
                ? 'Orbit Agent is Speaking (24kHz Audio)...'
                : isListening
                ? 'Listening to your voice (16kHz PCM)...'
                : isConnected
                ? 'Voice Bridge Connected'
                : 'Session Idle'}
            </div>
            <p className="text-xs text-[#655D59] max-w-sm">{statusMessage}</p>
          </div>

          {/* Connection Controls */}
          <div className="mt-6 flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={startVoiceSession}
                className="px-6 py-2.5 rounded-full font-semibold text-xs bg-[#2C2623] text-white hover:bg-[#443B35] flex items-center gap-2 shadow-md transition-all"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Start Live Voice Conversation</span>
              </button>
            ) : (
              <button
                onClick={stopVoiceSession}
                className="px-6 py-2.5 rounded-full font-semibold text-xs bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 shadow-md transition-all"
              >
                <MicOff className="w-4 h-4" />
                <span>Disconnect Voice Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Conversation Transcript & Quick Voice Prompts */}
        <div className="p-5 overflow-y-auto max-h-48 space-y-3 bg-[#FFFDF9]">
          <div className="text-[11px] font-semibold text-[#865302] uppercase tracking-wider">
            Live Conversation Transcript:
          </div>
          <div className="space-y-2">
            {transcript.map((item, idx) => (
              <div
                key={idx}
                className={`text-xs p-2.5 rounded-xl ${
                  item.sender === 'agent'
                    ? 'bg-[#FAF3EC] text-[#2C2623] border border-[#E3D5C5]'
                    : 'bg-[#2C2623] text-white ml-6'
                }`}
              >
                <span className="font-semibold block text-[10px] text-[#865302] mb-0.5">
                  {item.sender === 'agent' ? 'Orbit Voice Agent (Zephyr)' : 'You'}:
                </span>
                {item.text}
              </div>
            ))}
          </div>

          {/* Quick voice phrases */}
          <div className="pt-2">
            <span className="text-[10px] font-semibold text-[#865302] uppercase tracking-wider block mb-1.5">
              Or tap to simulate voice prompt:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Tell me when to leave tomorrow morning',
                'What is the traffic bottleneck near the highway toll?',
                'Suggest an off-grid tranquil homestay instead',
              ].map((phrase, i) => (
                <button
                  key={i}
                  onClick={() => handleSimulatedQuery(phrase)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF0E6] hover:bg-[#EFE2D4] text-[#443B33] border border-[#DECFC0] transition-colors"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E3D5C5] bg-[#FAF3EC] flex items-center justify-between text-xs text-[#655D59]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
            Powered by gemini-3.8-live over bi-directional WebSocket
          </span>
          <button
            onClick={() => {
              stopVoiceSession();
              onClose();
            }}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#EAE0D5] text-[#2C2623] hover:bg-[#DECFC0] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
