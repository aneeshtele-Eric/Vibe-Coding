import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  FileDown,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ThumbsDown,
  Brain,
  X,
  RefreshCw,
  Compass,
  Sliders,
  Check
} from 'lucide-react';
import { MemoryConstraint } from '../types';

interface TravellerDecisionStationProps {
  status: 'pending' | 'accepted' | 'rejected';
  revisionNumber: number;
  onAccept: () => void;
  onReject: (feedback: string, category?: MemoryConstraint['category']) => void;
  onOpenPdfModal: () => void;
  isAdapting: boolean;
  isLoading: boolean;
  memoryConstraints: MemoryConstraint[];
  onRemoveConstraint: (id: string) => void;
  onClearAllConstraints: () => void;
}

export const TravellerDecisionStation: React.FC<TravellerDecisionStationProps> = ({
  status,
  revisionNumber,
  onAccept,
  onReject,
  onOpenPdfModal,
  isAdapting,
  isLoading,
  memoryConstraints,
  onRemoveConstraint,
  onClearAllConstraints,
}) => {
  const [showCritiqueForm, setShowCritiqueForm] = useState(false);
  const [customCritique, setCustomCritique] = useState('');
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  const rejectionPresets: Array<{
    label: string;
    description: string;
    feedback: string;
    category: MemoryConstraint['category'];
  }> = [
    {
      label: 'Too Hectic / High Density',
      description: 'Halve waypoints & add 3+ hours dedicated porch/nature downtime',
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
      description: 'Shift departure advice to midday post-rush corridor window',
      feedback: 'Cannot depart at dawn. Shift departure advice to a comfortable mid-morning or early afternoon window.',
      category: 'timing',
    },
    {
      label: 'Optimize Cost Tier',
      description: 'Filter for curated boutique value under luxury tariffs',
      feedback: 'Too expensive. Adjust accommodation and dining constraints to boutique value tier.',
      category: 'budget',
    },
    {
      label: 'Off-Grid Nature & Solitude',
      description: 'Eliminate tourist clusters and enforce strict acoustic tranquility',
      feedback: 'Need deeper nature immersion. Eliminate tourist clusters and enforce strict off-grid serenity.',
      category: 'pace',
    },
  ];

  const handleApplyPreset = (preset: typeof rejectionPresets[0], idx: number) => {
    setActivePresetIndex(idx);
    onReject(preset.feedback, preset.category);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCritique.trim()) return;
    onReject(customCritique.trim(), 'custom');
    setCustomCritique('');
  };

  const isBusy = isAdapting || isLoading;

  return (
    <div
      id="traveller-decision-station"
      className="bg-[#FAF2EE] rounded-3xl border-2 border-[#E3D5C5] p-6 sm:p-8 shadow-[0_8px_32px_-8px_rgba(44,38,35,0.08)] relative overflow-hidden transition-all"
    >
      {/* Background architectural glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-[#C88A3C]/15 via-[#FAF2EE] to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* =========================================================================
          SECTION 1: PRIMARY DECISION BANNER (ACCEPT / REJECT / DOWNLOAD PDF)
      ========================================================================= */}
      <div className="pb-6 border-b border-[#E3D5C5]/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Status & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-data font-bold uppercase tracking-wider bg-[#2C2623] text-[#FFF8F5]">
                Proposal Revision #{revisionNumber}
              </span>

              {status === 'accepted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Proposal Accepted & Confirmed
                </span>
              ) : status === 'rejected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
                  <XCircle className="w-3.5 h-3.5 text-rose-700" />
                  Adapted via Traveller Critique
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white text-[#865302] border border-[#E3D5C5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
                  Awaiting Traveller Decision
                </span>
              )}

              <span className="text-[11px] text-[#837466] hidden sm:inline">
                Rule 3 · Rejection & Memory Loop
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold font-editorial text-[#1E1B19] tracking-tight">
              {status === 'accepted'
                ? 'Itinerary Blueprint Locked & Confirmed'
                : 'Traveller Decision & Autonomous Memory Loop'}
            </h3>

            <p className="text-xs sm:text-sm text-[#514538] mt-1.5 max-w-2xl leading-relaxed">
              {status === 'accepted'
                ? 'You have approved this plan proposal. You can now download the bespoke Editorial PDF Dossier featuring rich photography and interactive route schematics, or review memory constraints below.'
                : 'Decide on this plan: Accept to lock your schedule and download the publication-grade PDF dossier, or reject with a critique below to immediately force Orbit Engine to adapt constraints and recreate a fresh plan.'}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Download PDF button (prominent) */}
            <button
              type="button"
              onClick={onOpenPdfModal}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
                status === 'accepted'
                  ? 'bg-[#C88A3C] hover:bg-[#865302] text-white ring-2 ring-[#C88A3C]/40'
                  : 'bg-white hover:bg-[#FFF8F5] text-[#1E1B19] border border-[#E3D5C5]'
              }`}
              title="Download publication-grade Editorial Travel Dossier PDF"
            >
              <FileDown className="w-4 h-4 text-[#C88A3C]" />
              <span>Download Dossier PDF</span>
            </button>

            {status !== 'accepted' && (
              <>
                {/* Reject & Recreate button */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setShowCritiqueForm(!showCritiqueForm)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 hover:border-rose-300 flex items-center gap-2 transition-all disabled:opacity-50"
                  title="Reject current proposal and specify reason to adapt"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject & Recreate Plan</span>
                </button>

                {/* Accept Proposal button */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onAccept}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#2C2623] hover:bg-[#1E1B19] text-[#FFF8F5] flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50 border border-[#E3D5C5]/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Accept Plan Proposal</span>
                </button>
              </>
            )}

            {status === 'accepted' && (
              <button
                type="button"
                onClick={() => setShowCritiqueForm(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#837466] hover:text-[#BA1A1A] hover:bg-white/80 transition-colors border border-transparent hover:border-[#E3D5C5]"
              >
                Reopen & Adapt Plan
              </button>
            )}
          </div>
        </div>

        {/* Accepted Confirmation Toast Card */}
        {status === 'accepted' && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">Itinerary Proposal Officially Locked</span>
                <span className="text-[11px] text-emerald-800">
                  Ready for transit departure. Editorial PDF Dossier is ready for offline export.
                </span>
              </div>
            </div>
            <button
              onClick={onOpenPdfModal}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Offline PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: MEMORY LOOP & INSTANT CONSTRAINT REJECTION ADAPTATION
      ========================================================================= */}
      <div className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#865302] text-white flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
                Critique & Memory Engine
              </span>
              <h4 className="text-base font-bold text-[#1E1B19]">
                Instant Constraint Recalibration & Learned Memory
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {memoryConstraints.length > 0 && (
              <button
                type="button"
                onClick={onClearAllConstraints}
                className="text-xs text-[#837466] hover:text-[#BA1A1A] transition-colors underline"
              >
                Reset Memory Bank ({memoryConstraints.length})
              </button>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#514538] mb-5 leading-relaxed">
          Rejecting or critiquing any aspect recalibrates Orbit Engine instantly: reducing waypoints by 50%,
          enforcing porch downtime, shifting departure timings away from tolls, or pivoting accommodation categories.
          Every critique is permanently stored in the active memory bank below.
        </p>

        {/* Quick Critique Chips (Instant One-Click Rejection & Recreation) */}
        <div className="mb-5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#514538] mb-2.5 flex items-center gap-1.5">
            <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
            One-Click Rejection & Adaptation Triggers (Recreates Plan Instantly):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rejectionPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isBusy}
                onClick={() => handleApplyPreset(preset, idx)}
                className="p-3.5 rounded-xl text-left bg-white border border-[#E3D5C5] hover:border-rose-400 hover:bg-rose-50/40 transition-all group disabled:opacity-50 shadow-2xs relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1E1B19] group-hover:text-rose-900 transition-colors flex items-center gap-1.5">
                    <RotateCcw className="w-3 h-3 text-[#C88A3C] group-hover:rotate-180 transition-transform duration-300" />
                    {preset.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#837466] group-hover:translate-x-0.5 group-hover:text-rose-700 transition-all" />
                </div>
                <p className="text-[11px] text-[#655D59] line-clamp-2">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Critique Form */}
        <form onSubmit={handleCustomSubmit} className="mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#514538] mb-1.5">
            Or Provide Specific Feedback / Custom Constraint:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customCritique}
              onChange={(e) => setCustomCritique(e.target.value)}
              placeholder="e.g. Too many temples, prefer quiet cafe work spot, avoid steep mountain hairpin turns..."
              className="flex-1 px-4 py-2.5 bg-white border border-[#E3D5C5] rounded-xl text-xs sm:text-sm text-[#1E1B19] placeholder:text-[#837466]/60 focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400"
            />
            <button
              type="submit"
              disabled={!customCritique.trim() || isBusy}
              className="px-5 py-2.5 bg-[#2C2623] hover:bg-[#1E1B19] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
              <span>Reject & Recreate Plan</span>
            </button>
          </div>
        </form>

        {/* Live Active Learned Agent Memory Bank Display */}
        {memoryConstraints.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E3D5C5]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865302] flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-[#C88A3C]" />
                Active Learned Memory Bank ({memoryConstraints.length} constraints enforcing agent behavior)
              </span>
              <span className="text-[10px] text-[#837466]">
                Propagated across every itinerary & purchasing decision
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {memoryConstraints.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-[#FAF2EE] text-[#1E1B19] border border-[#E3D5C5] shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C88A3C]" />
                  <span className="font-medium text-[11px]">{c.description}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveConstraint(c.id)}
                    className="text-[#837466] hover:text-[#BA1A1A] transition-colors p-0.5 rounded-full hover:bg-[#E3D5C5]/40"
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
    </div>
  );
};
