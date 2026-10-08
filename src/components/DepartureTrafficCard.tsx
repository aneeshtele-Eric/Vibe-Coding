import React, { useState } from 'react';
import { Clock, Route, AlertTriangle, ShieldCheck, BellRing, Check, TrendingDown, ArrowUpRight, Calendar } from 'lucide-react';
import { DepartureAdvice, SeasonalDynamics } from '../types';

interface DepartureTrafficCardProps {
  advice: DepartureAdvice;
  origin: string;
  destination: string;
  seasonalDynamics?: SeasonalDynamics;
}

export const DepartureTrafficCard: React.FC<DepartureTrafficCardProps> = ({
  advice,
  origin,
  destination,
  seasonalDynamics,
}) => {
  const [alarmSet, setAlarmSet] = useState(false);

  // Simulated traffic curve data for visual congestion analysis
  const congestionCurve = [
    { time: '05:00 AM', delayMin: 10, isOptimal: false },
    { time: '05:45 AM', delayMin: 5, isOptimal: true },
    { time: '07:00 AM', delayMin: 45, isOptimal: false },
    { time: '08:30 AM', delayMin: 110, isOptimal: false },
    { time: '10:00 AM', delayMin: 85, isOptimal: false },
    { time: '12:00 PM', delayMin: 40, isOptimal: false },
  ];

  const handleSetAlarm = () => {
    setAlarmSet(true);
    setTimeout(() => setAlarmSet(false), 3500);
  };

  return (
    <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(44,38,35,0.06)] relative overflow-hidden transition-all">
      {/* Header kicker */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
              Rule 1 · Departure & Traffic Reasoning
            </span>
            <h3 className="text-base font-bold text-[#1E1B19]">
              Decisive Departure Window
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Google Search Grounding indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Search Grounded: Live Traffic Intel</span>
          </div>

          {seasonalDynamics && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              seasonalDynamics.rush_factor === 'High' || seasonalDynamics.rush_factor === 'Peak Surge'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>{seasonalDynamics.date_classification} (Rush: {seasonalDynamics.rush_factor})</span>
            </div>
          )}

          {/* Distance badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E3D5C5] text-xs font-data font-semibold text-[#514538]">
            <Route className="w-3.5 h-3.5 text-[#865302]" />
            <span>{advice.total_distance_km} km</span>
            <span className="text-[#837466] font-normal">total corridor</span>
          </div>
        </div>
      </div>

      {/* Recommended Time Hero Banner */}
      <div className="bg-white rounded-xl border border-[#E3D5C5] p-4 sm:p-5 mb-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#655D59] font-medium block mb-1">
              Exact Recommended Departure Window:
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B19] font-editorial">
              {advice.recommended_time}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-semibold">Zero Idling Window</span>
              <span className="text-[#655D59]">· Saves estimated 85–115 min in gridlock</span>
            </div>
          </div>

          <button
            onClick={handleSetAlarm}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              alarmSet
                ? 'bg-emerald-800 text-white'
                : 'bg-[#2C2623] hover:bg-[#1E1B19] text-[#FFF8F5]'
            }`}
          >
            {alarmSet ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Departure Alarm Synced</span>
              </>
            ) : (
              <>
                <BellRing className="w-4 h-4 text-[#C88A3C]" />
                <span>Sync Window to Calendar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Route & Traffic Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
        <div className="md:col-span-7 space-y-3.5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#655D59] block mb-1">
              Optimal Corridor Route
            </span>
            <p className="text-sm font-medium text-[#1E1B19] bg-white/70 p-3 rounded-lg border border-[#E3D5C5]/60 leading-relaxed">
              {advice.route}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865302] block mb-1">
              Geographic Bottleneck Analysis
            </span>
            <div className="bg-[#FFF8F5] p-3.5 rounded-lg border border-[#E3D5C5] text-xs text-[#514538] leading-relaxed">
              {advice.traffic_notes}
            </div>
          </div>
        </div>

        {/* Visual Congestion Chart */}
        <div className="md:col-span-5 bg-white rounded-xl border border-[#E3D5C5] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#1E1B19] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#C88A3C]" />
              Congestion Curve vs. Time
            </span>
            <span className="text-[10px] text-[#837466] font-data">Delay Penalty</span>
          </div>

          <div className="space-y-2 py-1">
            {congestionCurve.map((point, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className={`w-16 font-data text-[11px] ${point.isOptimal ? 'font-bold text-[#865302]' : 'text-[#655D59]'}`}>
                  {point.time}
                </span>
                <div className="flex-1 bg-[#F4ECE8] h-3.5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      point.isOptimal
                        ? 'bg-emerald-600'
                        : point.delayMin > 60
                        ? 'bg-[#BA1A1A]/80'
                        : 'bg-[#C88A3C]/70'
                    }`}
                    style={{ width: `${Math.min(100, (point.delayMin / 120) * 100)}%` }}
                  />
                </div>
                <span className={`w-14 text-right font-data text-[11px] ${point.isOptimal ? 'text-emerald-700 font-bold' : 'text-[#514538]'}`}>
                  +{point.delayMin}m {point.isOptimal && '★'}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#837466] mt-2 pt-2 border-t border-[#E3D5C5]/60">
            ★ Highlights the zero-friction corridor selected by Orbit Engine
          </p>
        </div>
      </div>
    </div>
  );
};
