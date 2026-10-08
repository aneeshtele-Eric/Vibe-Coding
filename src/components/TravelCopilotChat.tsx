import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, ExternalLink, Bot, User, Globe, Loader2, X, RefreshCw } from 'lucide-react';
import { OrbitPlan } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  groundingSources?: Array<{ title: string; url: string }>;
  timestamp: string;
}

interface TravelCopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: OrbitPlan | null;
  origin: string;
  destination: string;
  dates: string;
}

export const TravelCopilotChat: React.FC<TravelCopilotChatProps> = ({
  isOpen,
  onClose,
  currentPlan,
  origin,
  destination,
  dates,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your autonomous Orbit Travel Copilot. I'm actively tracking traffic, crowd dynamics, and quiet retreats for ${origin} → ${destination} (${dates}). How can I assist your journey?`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            origin,
            destination,
            dates,
            summary: currentPlan?.summary,
            hotelName: currentPlan?.hotel_recommendation?.name,
            departureTime: currentPlan?.departure_advice?.recommended_time,
            route: currentPlan?.departure_advice?.route,
          },
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || 'Understood. Adjusting route pacer and timing for your itinerary.',
        groundingSources: data.groundingSources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: `I've registered your question regarding "${userText}". Recommendation: Stick to your recommended departure window to bypass highway toll backups and ensure a calm arrival.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'What should I pack for this trip?',
    'Any quiet breakfast spot on the highway?',
    'What if we leave 2 hours later?',
    'Is there an EV charging station along this route?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[440px] bg-[#FFFDF9] border-l border-[#E3D5C5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E3D5C5] bg-[#FAF3EC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2C2623] text-[#C88A3C] flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#1E1B19] text-sm">Orbit Travel Copilot</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-[#655D59]">Multi-turn AI · Grounded in Google Search</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#655D59] hover:text-[#1E1B19] hover:bg-[#EAE0D5] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, index) => (
          <div
            key={index}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#FAF0E6] border border-[#DECFC0] text-[#865302] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#2C2623] text-[#FAF6F0] rounded-tr-xs shadow-xs'
                  : 'bg-[#F9F5F0] text-[#2C2623] border border-[#E3D5C5] rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>

              {/* Grounding Source Citations if present */}
              {m.groundingSources && m.groundingSources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#E8DCCF] space-y-1">
                  <div className="text-[10px] font-semibold text-[#865302] flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5 text-[#C88A3C]" />
                    <span>Search Grounding Sources:</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {m.groundingSources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-[#5A4F44] hover:text-[#865302] underline truncate"
                      >
                        <span className="truncate">{source.title}</span>
                        <ExternalLink className="w-2 h-2 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[9px] mt-1 text-right ${
                  m.role === 'user' ? 'text-[#FAF6F0]/60' : 'text-[#8A7F75]'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#2C2623] text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-[#865302] p-2 bg-[#FAF3EC] rounded-xl border border-[#DECFC0]">
            <Loader2 className="w-4 h-4 animate-spin text-[#C88A3C]" />
            <span>Consulting Google Search & verifying traffic patterns...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 border-t border-[#EAE0D5] bg-[#FAF5EE]">
        <div className="text-[10px] font-semibold text-[#865302] uppercase tracking-wider mb-1.5">
          Quick Prompts:
        </div>
        <div className="flex flex-wrap gap-1">
          {sampleQuestions.slice(0, 3).map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="text-[11px] text-left px-2 py-1 rounded-md bg-white hover:bg-[#F2E8DC] text-[#4F4439] border border-[#DFCFC0] transition-colors truncate max-w-[200px]"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-[#E3D5C5] bg-[#FFFDF9]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Orbit Copilot anything about your route..."
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FAF6F0] border border-[#DECFC0] focus:outline-none focus:ring-2 focus:ring-[#C88A3C]/40 text-[#2C2623]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-2 rounded-xl bg-[#2C2623] text-white hover:bg-[#443B35] disabled:opacity-40 transition-all flex items-center justify-center shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
