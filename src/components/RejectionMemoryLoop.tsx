import React, { useState } from 'react';
import { ThumbsDown, Brain, Zap, RefreshCw, X, ShieldAlert, Check, ArrowRight } from 'lucide-react';
import { MemoryConstraint } from '../types';

interface RejectionMemoryLoopProps {
  memoryConstraints: MemoryConstraint[];
  onRejectWithFeedback: (feedback: string, category: 'pace' | 'lodging' | 'timing' | 'budget' | 'custom') => void;
  onRemoveConstraint: (id: string) => void;
  onClearAllConstraints: () => void;
  isAdapting: boolean;
}

export const RejectionMemoryLoop: React.FC<RejectionMemoryLoopProps> = ({
  memoryConstraints,
  onRejectWithFeedback,
  onRemoveConstraint,
  onClearAllConstraints,
  isAdapting,
}) => {
  const [customCritique, setCustomCritique] = useState('');
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  const rejectionPresets: Array<{
    label: string;
    description: string;
    feedback: string;
    category: 'pace' | 'lodging' | 'timing' | 'budget' | 'custom';
  }> = [
    {
      label: 'Too Hectic / High Density',
      description: 'Halve waypoints & add 3+ hours unstructured porch/nature downtime',
      feedback: 'Plan is too hectic. Reduce waypoints by 50% and prioritize generous unstructured downtime.',
      category: 'pace',
    },
    {
      label: 'Disliked Resort Style',
      description: 'Switch lodging taxonomy to secluded private heritage homestay/bungalow',
      feedback: 'Disliked resort style. Switch accommodation to private secluded plantation homestay or architectural boutique.',
      category: 'lodging',
    },
    {
      label: 'Avoid Dawn Departure',
      description: 'Shift departure window to midday post-rush corridor',
      feedback: 'Cannot depart at dawn. Shift departure advice to a comfortable mid-morning or early afternoon window.',
      category: 'timing',
    },
    {
      label: 'Optimize Cost Tier',
      description: 'Filter for curated boutique value under luxury tariffs',
      feedback: 'Too expensive. Adjust accommodation and dining constraints to boutique value tier.',
      category: 'budget',
    },
  ];

  const handleApplyPreset = (preset: typeof rejectionPresets[0], idx: number) => {
    setActivePresetIndex(idx);
    onRejectWithFeedback(preset.feedback, preset.category);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCritique.trim()) return;
    onRejectWithFeedback(customCritique.trim(), 'custom');
    setCustomCritique('');
  };

  return (
    <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(44,38,35,0.06)] relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#865302] text-white flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
              Rule 3 · Rejection & Memory Loop
            </span>
            <h3 className="text-base font-bold text-[#1E1B19]">
              Critique & Instant Constraint Adaptation
            </h3>
          </div>
        </div>

        {memoryConstraints.length > 0 && (
          <button
            onClick={onClearAllConstraints}
            className="text-xs text-[#837466] hover:text-[#BA1A1A] transition-colors underline"
          >
            Reset Memory Bank
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm text-[#514538] mb-5 leading-relaxed">
        Autonomous agents eliminate decision fatigue by adapting constraints instantly upon critique.
        Selecting feedback will immediately recalibrate waypoints, lodging taxonomy, and transit schedules.
      </p>

      {/* Instant Feedback Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {rejectionPresets.map((preset, idx) => (
          <button
            key={idx}
            disabled={isAdapting}
            onClick={() => handleApplyPreset(preset, idx)}
            className="p-3.5 rounded-xl text-left bg-white border border-[#E3D5C5] hover:border-[#C88A3C] hover:bg-[#FFF8F5] transition-all group disabled:opacity-50 shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#1E1B19] group-hover:text-[#865302] transition-colors flex items-center gap-1.5">
                <ThumbsDown className="w-3 h-3 text-[#C88A3C]" />
                {preset.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#837466] group-hover:translate-x-0.5 group-hover:text-[#865302] transition-all" />
            </div>
            <p className="text-[11px] text-[#655D59] line-clamp-1">
              {preset.description}
            </p>
          </button>
        ))}
      </div>

      {/* Custom Critique Input */}
      <form onSubmit={handleSubmitCustom} className="mb-5">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#514538] mb-1.5">
          Or Enter Custom Critique / Specific Constraint
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCritique}
            onChange={(e) => setCustomCritique(e.target.value)}
            placeholder="e.g. Prefer riverside cottages over hilltops, traveling with dog, want slow artisanal food"
            className="flex-1 px-4 py-2 bg-white border border-[#E3D5C5] rounded-xl text-xs sm:text-sm text-[#1E1B19] placeholder:text-[#837466]/60 focus:outline-none focus:ring-2 focus:ring-[#C88A3C]/40 focus:border-[#C88A3C]"
          />
          <button
            type="submit"
            disabled={!customCritique.trim() || isAdapting}
            className="px-4 py-2 bg-[#2C2623] hover:bg-[#1E1B19] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAdapting ? 'animate-spin' : ''}`} />
            <span>Adapt</span>
          </button>
        </div>
      </form>

      {/* Active Learned Memory Constraints List */}
      {memoryConstraints.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-[#E3D5C5]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865302] flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-[#C88A3C]" />
              Learned Agent Memory Bank ({memoryConstraints.length})
            </span>
            <span className="text-[10px] text-[#837466]">Active across all recommendations</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {memoryConstraints.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#FAF2EE] text-[#1E1B19] border border-[#E3D5C5]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C88A3C]" />
                <span className="font-medium text-[11px]">{c.description}</span>
                <button
                  onClick={() => onRemoveConstraint(c.id)}
                  className="text-[#837466] hover:text-[#BA1A1A] transition-colors"
                  title="Remove constraint"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
