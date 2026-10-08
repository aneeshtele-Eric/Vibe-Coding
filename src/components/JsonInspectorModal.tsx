import React, { useState } from 'react';
import { X, Copy, Check, Code2, ShieldCheck } from 'lucide-react';
import { OrbitPlan } from '../types';

interface JsonInspectorModalProps {
  plan: OrbitPlan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JsonInspectorModal: React.FC<JsonInspectorModalProps> = ({
  plan,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !plan) return null;

  const jsonString = JSON.stringify(plan, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E3D5C5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E1B19]">
                  Strict JSON Output Schema
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Validated Schema
                </span>
              </div>
              <p className="text-xs text-[#655D59]">
                Operating Rule 4: Structured agent response delivered directly from engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF2EE] hover:bg-[#ECE0DB] text-[#1E1B19] border border-[#E3D5C5] flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#865302]" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#837466] hover:text-[#1E1B19] hover:bg-[#F4ECE8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 overflow-auto p-5 bg-[#1E1B19] text-[#FFF8F5]">
          <pre className="font-data text-xs leading-relaxed text-[#ECE0DB] selection:bg-[#C88A3C]/30">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3D5C5] bg-white flex items-center justify-between text-xs text-[#655D59]">
          <span>Payload size: ~{(new Blob([jsonString]).size / 1024).toFixed(1)} KB</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2C2623] text-white font-medium hover:bg-[#1E1B19]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
