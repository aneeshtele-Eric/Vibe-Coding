import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ShieldCheck, FileDown, Sparkles, AlertCircle, ArrowRight, ThumbsDown } from 'lucide-react';

interface ProposalDecisionBarProps {
  status: 'pending' | 'accepted' | 'rejected';
  revisionNumber: number;
  onAccept: () => void;
  onReject: (feedback: string) => void;
  onOpenPdfModal: () => void;
  isRecreating: boolean;
}

export const ProposalDecisionBar: React.FC<ProposalDecisionBarProps> = ({
  status,
  revisionNumber,
  onAccept,
  onReject,
  onOpenPdfModal,
  isRecreating,
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('Too hectic — reduce waypoints by 50% and increase downtime');
  const [customReason, setCustomReason] = useState<string>('');

  const rejectionOptions = [
    'Too hectic — reduce waypoints by 50% and increase downtime',
    'Disliked resort style — switch lodging to secluded private heritage homestay',
    'Departure window incompatible — adjust traffic timing to comfortable midday hours',
    'Too expensive — optimize accommodation and dining constraints to value tier',
    'Need more outdoor nature & walks — eliminate commercial tourist spots',
  ];

  const handleConfirmReject = () => {
    const feedback = customReason.trim() ? customReason.trim() : selectedReason;
    onReject(feedback);
    setShowRejectForm(false);
    setCustomReason('');
  };

  return (
    <div className="bg-[#FAF2EE] rounded-2xl border-2 border-[#E3D5C5] p-5 sm:p-6 shadow-[0_6px_24px_-6px_rgba(44,38,35,0.08)] relative overflow-hidden transition-all">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-l from-[#C88A3C]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Status & Revision Kicker */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-data font-bold uppercase tracking-wider bg-[#2C2623] text-[#FFF8F5]">
              Proposal Revision #{revisionNumber}
            </span>
            {status === 'accepted' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Proposal Accepted & Locked
              </span>
            ) : status === 'rejected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                Previous Version Rejected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FFF8F5] text-[#865302] border border-[#E3D5C5]">
                <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
                Pending Traveler Decision
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-editorial text-[#1E1B19]">
            {status === 'accepted'
              ? 'Itinerary Blueprint Locked & Confirmed'
              : 'Review Autonomous Proposal'}
          </h3>
          <p className="text-xs sm:text-sm text-[#655D59] mt-1 max-w-2xl leading-relaxed">
            {status === 'accepted'
              ? 'You have approved this plan. You can now download the high-fidelity Editorial PDF Dossier with rich photography and interactive route maps, or hold your sanctuary reservation.'
              : 'Accept this decisive blueprint to lock your dates and download the bespoke Editorial PDF Dossier, or reject it to immediately have Orbit Engine adapt constraints and recreate a fresh plan.'}
          </p>
        </div>

        {/* Right: Primary Accept & Reject Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Download PDF button (always prominent, highlighted when accepted) */}
          <button
            type="button"
            onClick={onOpenPdfModal}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
              status === 'accepted'
                ? 'bg-[#C88A3C] hover:bg-[#865302] text-white ring-2 ring-[#C88A3C]/40 animate-pulse'
                : 'bg-white hover:bg-[#FFF8F5] text-[#1E1B19] border border-[#E3D5C5]'
            }`}
            title="Download bespoke high-fidelity travel dossier PDF with photos & route"
          >
            <FileDown className="w-4 h-4 text-[#C88A3C]" />
            <span>Download Dossier PDF</span>
          </button>

          {status !== 'accepted' && (
            <>
              {/* Reject & Recreate button */}
              <button
                type="button"
                disabled={isRecreating}
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 hover:border-rose-300 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject & Recreate Plan</span>
              </button>

              {/* Accept button */}
              <button
                type="button"
                disabled={isRecreating}
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
              onClick={() => setShowRejectForm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#837466] hover:text-[#BA1A1A] hover:bg-white/80 transition-colors"
            >
              Reopen & Modify
            </button>
          )}
        </div>
      </div>

      {/* Expanded Rejection & Recreation Panel */}
      {showRejectForm && (
        <div className="mt-5 pt-5 border-t border-[#E3D5C5] animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-rose-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Reject Proposal: Select Reason for Orbit Engine to Recreate Plan
              </h4>
            </div>

            <div className="space-y-2 mb-4">
              {rejectionOptions.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedReason === opt && !customReason.trim()
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-medium'
                      : 'bg-white hover:bg-[#FAF2EE]/50 border-[#E3D5C5] text-[#514538]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={selectedReason === opt && !customReason.trim()}
                    onChange={() => {
                      setSelectedReason(opt);
                      setCustomReason('');
                    }}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Custom reason input */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-[#655D59] mb-1">
                Or type a specific critique for the agent to adapt:
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Dislike mountainous roads, need kid-friendly pace, prefer scenic coastal trains..."
                className="w-full px-3.5 py-2 text-xs bg-[#FAF2EE]/50 border border-[#E3D5C5] rounded-xl text-[#1E1B19] focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#655D59] hover:bg-[#FAF2EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRecreating}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRecreating ? 'animate-spin' : ''}`} />
                <span>Confirm Rejection & Recreate Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
