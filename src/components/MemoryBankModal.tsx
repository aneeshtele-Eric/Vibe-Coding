import React from 'react';
import { X, Brain, Trash2, Plus, Sparkles, Check } from 'lucide-react';
import { MemoryConstraint } from '../types';

interface MemoryBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryConstraints: MemoryConstraint[];
  onRemoveConstraint: (id: string) => void;
  onClearAll: () => void;
  onAddManualConstraint: (text: string) => void;
}

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  isOpen,
  onClose,
  memoryConstraints,
  onRemoveConstraint,
  onClearAll,
  onAddManualConstraint,
}) => {
  const [newRule, setNewRule] = React.useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    onAddManualConstraint(newRule.trim());
    setNewRule('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E3D5C5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#865302] text-white flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B19]">
                Agent Memory Bank
              </h3>
              <p className="text-xs text-[#655D59]">
                Autonomous constraint memory accumulated from user critique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#837466] hover:text-[#1E1B19] hover:bg-[#F4ECE8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-[#514538] leading-relaxed">
            Rule 3 ensures Orbit Engine permanently remembers your trip dislikes and pacing bounds.
            Every rejected itinerary updates this memory bank to generate increasingly decisive blueprints.
          </p>

          {/* Quick add rule */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Add custom permanent constraint..."
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#E3D5C5] rounded-xl text-[#1E1B19] focus:outline-none focus:border-[#C88A3C]"
            />
            <button
              type="submit"
              disabled={!newRule.trim()}
              className="px-3.5 py-2 bg-[#2C2623] hover:bg-[#1E1B19] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Constraints list */}
          <div className="space-y-2 mt-3">
            {memoryConstraints.length === 0 ? (
              <div className="p-8 text-center bg-white/70 rounded-xl border border-dashed border-[#E3D5C5] text-xs text-[#837466]">
                <Sparkles className="w-5 h-5 text-[#C88A3C] mx-auto mb-2 opacity-60" />
                No constraints learned yet. Reject any plan or select a critique chip to train the memory bank.
              </div>
            ) : (
              memoryConstraints.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-white border border-[#E3D5C5] flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#C88A3C]" />
                    <div>
                      <span className="text-xs font-medium text-[#1E1B19] block">
                        {c.description}
                      </span>
                      <span className="text-[10px] text-[#837466] uppercase tracking-wider">
                        Category: {c.category} · {c.addedAt}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveConstraint(c.id)}
                    className="p-1.5 rounded-lg text-[#837466] hover:text-[#BA1A1A] hover:bg-rose-50 transition-colors"
                    title="Remove constraint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3D5C5] bg-white flex items-center justify-between">
          {memoryConstraints.length > 0 ? (
            <button
              onClick={onClearAll}
              className="text-xs text-[#BA1A1A] hover:underline font-medium"
            >
              Clear All Rules
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2C2623] hover:bg-[#1E1B19] text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
