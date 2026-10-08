import React from 'react';
import { ArrowRightLeft, Sparkles } from 'lucide-react';

interface QuickPivotsProps {
  pivots: string[];
  onSelectPivot: (pivotText: string) => void;
  isLoading: boolean;
}

export const QuickPivots: React.FC<QuickPivotsProps> = ({
  pivots,
  onSelectPivot,
  isLoading,
}) => {
  if (!pivots || pivots.length === 0) return null;

  return (
    <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(44,38,35,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
            Schema Field · Alternative Quick Pivots
          </span>
          <h3 className="text-base font-bold text-[#1E1B19]">
            Instant Autonomous Pivots
          </h3>
        </div>
      </div>

      <p className="text-xs text-[#514538] mb-4">
        Pre-calculated strategic adjustments. Click any option to immediately transform the blueprint:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pivots.map((pivot, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => onSelectPivot(pivot)}
            className="p-3.5 rounded-xl bg-white border border-[#E3D5C5] hover:border-[#C88A3C] hover:bg-[#FFF8F5] text-left transition-all group disabled:opacity-50 flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B19] group-hover:text-[#865302] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C88A3C] shrink-0" />
              <span>Pivot Option {idx + 1}</span>
            </div>
            <p className="text-xs text-[#514538] leading-relaxed">
              {pivot}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
