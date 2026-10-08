import React from 'react';
import { Compass, Sparkles, Brain, Code2, Globe, Mic, MessageSquare } from 'lucide-react';
import { MemoryConstraint } from '../types';

interface HeaderProps {
  memoryConstraints: MemoryConstraint[];
  onOpenMemory: () => void;
  onOpenJson: () => void;
  onOpenPdf?: () => void;
  onOpenSearch?: () => void;
  onOpenVoice?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  isAiConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  memoryConstraints,
  onOpenMemory,
  onOpenJson,
  onOpenPdf,
  onOpenSearch,
  onOpenVoice,
  onToggleChat,
  isChatOpen,
  isAiConnected: _isAiConnected,
}) => {
  return (
    <header className="border-b border-[#E3D5C5]/60 bg-[#FFF8F5]/90 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="relative w-11 h-11 rounded-xl bg-[#2C2623] flex items-center justify-center text-[#C88A3C] shadow-sm border border-[#E3D5C5]/30">
            <Compass className="w-6 h-6 animate-[spin_20s_linear_infinite]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C88A3C] ring-2 ring-[#FFF8F5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#1E1B19]">
                The Orbit <span className="font-editorial italic font-normal text-[#C88A3C]">Travel Intelligence</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#F4ECE8] text-[#865302] border border-[#E3D5C5]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Autonomous Agent
              </span>
            </div>
            <p className="text-xs text-[#655D59] hidden lg:block">
              Decision fatigue elimination · Real-time traffic, crowd & sentiment reasoning
            </p>
          </div>
        </div>


        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Live Voice API Button */}
          {onOpenVoice && (
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2C2623] hover:bg-[#443B35] text-amber-300 border border-amber-500/40 transition-colors shadow-2xs"
              title="Open Gemini 3.8 Live Voice Conversation"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live Voice</span>
            </button>
          )}

          {/* Copilot Chat Button */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shadow-2xs ${
                isChatOpen
                  ? 'bg-[#C88A3C] text-white border-[#865302]'
                  : 'bg-[#FAF2EE] hover:bg-[#ECE0DB] text-[#865302] border-[#E3D5C5]'
              }`}
              title="Toggle Multi-turn Travel Copilot"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C88A3C]" />
              <span className="hidden sm:inline">Copilot</span>
            </button>
          )}

          {/* Google Search Grounding Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#F4ECE8] text-[#2C2623] border border-[#E3D5C5] transition-colors shadow-2xs"
              title="Search Grounding: Live Google Search intelligence"
            >
              <Globe className="w-3.5 h-3.5 text-[#C88A3C]" />
              <span>Search Intel</span>
            </button>
          )}

          {/* Editorial PDF Dossier Button */}
          {onOpenPdf && (
            <button
              onClick={onOpenPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF2EE] hover:bg-[#ECE0DB] text-[#865302] border border-[#E3D5C5] transition-colors shadow-2xs"
              title="Download bespoke high-fidelity travel dossier PDF"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
              <span>Dossier PDF</span>
            </button>
          )}

          {/* Active Memory Constraints Badge */}
          <button
            onClick={onOpenMemory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F7F4EE] hover:bg-[#ECE0DB] text-[#2C2623] border border-[#E3D5C5] transition-colors"
            title="View learned constraints in agent memory"
          >
            <Brain className="w-3.5 h-3.5 text-[#C88A3C]" />
            <span className="hidden xl:inline">Memory Bank:</span>
            <span className="font-data font-semibold text-[#865302]">
              {memoryConstraints.length} {memoryConstraints.length === 1 ? 'Rule' : 'Rules'}
            </span>
          </button>

          {/* Strict JSON Inspector */}
          <button
            onClick={onOpenJson}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-[#F4ECE8] text-[#514538] border border-[#E3D5C5] transition-colors shadow-2xs"
            title="Inspect strict JSON output schema"
          >
            <Code2 className="w-3.5 h-3.5 text-[#865302]" />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
};
