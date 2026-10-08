import React, { useMemo } from 'react';
import { Calendar, AlertCircle, TrendingUp, TrendingDown, Clock, ShieldCheck, Sparkles, Lock } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number | 'all';
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDurationChange: (days: number | 'all') => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  durationDays,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
}) => {
  const isOneDay = durationDays === 1;

  // Analyze the selected dates for weekend / weekday / holiday dynamics
  const dateAnalysis = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate + 'T00:00:00');
    const end = endDate ? new Date(endDate + 'T00:00:00') : start;

    const startDay = start.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    const endDay = end.getDay();

    const isWeekend =
      startDay === 5 || startDay === 6 || startDay === 0 ||
      endDay === 5 || endDay === 6 || endDay === 0;

    const isMidweek = !isWeekend && (startDay >= 1 && startDay <= 4);

    // Compute day diff
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const computedDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // Month check for peak seasons (October in India is festive/monsoon retreat season, autumn foliage in US/Japan)
    const month = start.getMonth(); // 9 is October
    const isHolidaySeason = month === 9 || month === 11; // Oct or Dec

    let classification = 'Standard Window';
    let rushLevel: 'Low' | 'Moderate' | 'High' | 'Peak Surge' = 'Moderate';
    let priceMultiplier = 'Standard Rates';
    let advice = '';

    if (isOneDay) {
      classification = 'Single-Day Turnaround';
      rushLevel = isWeekend ? 'High' : 'Moderate';
      priceMultiplier = 'Zero Lodging Tariff';
      advice = isWeekend
        ? 'Heavy weekend day-tripper traffic expected. Strict dawn departure and early afternoon return window required.'
        : 'Smooth off-peak road conditions. Avoid city commuter rush hours (08:30 – 10:00 AM).';
    } else if (isWeekend) {
      classification = isHolidaySeason ? 'Festive Weekend Peak' : 'Weekend Leisure Surge';
      rushLevel = isHolidaySeason ? 'Peak Surge' : 'High';
      priceMultiplier = '+25% to +35% Peak Tariff';
      advice = 'Leisure travel exodus peaks Friday 17:30 – 21:00 and Saturday 06:30 – 09:30. Dawn departure is critical to avoid 1.8x travel time penalties.';
    } else if (isMidweek) {
      classification = 'Midweek Serenity Advantage';
      rushLevel = 'Low';
      priceMultiplier = 'Up to 30% Off-Peak Savings';
      advice = 'Exceptional acoustic tranquility. Commercial lodges drop rates significantly and major corridors experience zero leisure bottlenecks.';
    }

    const startFormatted = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return {
      isWeekend,
      isMidweek,
      computedDays,
      classification,
      rushLevel,
      priceMultiplier,
      advice,
      startFormatted,
      endFormatted,
    };
  }, [startDate, endDate, isOneDay]);

  const handleStartChange = (newStart: string) => {
    onStartDateChange(newStart);
    if (isOneDay) {
      onEndDateChange(newStart);
    } else {
      // If end date is earlier than start date, bump it
      if (new Date(endDate) < new Date(newStart)) {
        onEndDateChange(newStart);
      }
    }
  };

  const handleEndChange = (newEnd: string) => {
    onEndDateChange(newEnd);
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(newEnd + 'T00:00:00');
      if (end >= start) {
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        onDurationChange(diffDays);
      }
    }
  };

  // Helper date preset buttons
  const applyPreset = (days: number, startOffset: number) => {
    const today = new Date('2026-10-08T00:00:00'); // Baseline local date
    const start = new Date(today);
    start.setDate(today.getDate() + startOffset);

    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];

    onStartDateChange(sStr);
    onEndDateChange(eStr);
    onDurationChange(days);
  };

  return (
    <div className="space-y-3">
      {/* Date Range Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Start / Departure Date */}
        <div>
          <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#514538] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#865302]" />
              Departure Date
            </span>
            {dateAnalysis && (
              <span className="text-[10px] text-[#865302] font-semibold lowercase">
                ({dateAnalysis.startFormatted})
              </span>
            )}
          </label>
          <input
            type="date"
            min="2026-10-08"
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E3D5C5] rounded-xl text-xs sm:text-sm text-[#1E1B19] focus:outline-none focus:ring-2 focus:ring-[#C88A3C]/40 focus:border-[#C88A3C] transition-all font-data"
          />
        </div>

        {/* End / Return Date */}
        <div>
          <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#514538] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#865302]" />
              Return Date
            </span>
            {isOneDay ? (
              <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Lock className="w-2.5 h-2.5" />
                1-Day: Return Locked
              </span>
            ) : dateAnalysis ? (
              <span className="text-[10px] text-[#865302] font-semibold lowercase">
                ({dateAnalysis.endFormatted})
              </span>
            ) : null}
          </label>
          <div className="relative">
            <input
              type="date"
              min={startDate || '2026-10-08'}
              value={isOneDay ? startDate : endDate}
              disabled={isOneDay}
              onChange={(e) => handleEndChange(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-data border transition-all ${
                isOneDay
                  ? 'bg-[#F4ECE8]/70 border-[#E3D5C5] text-[#837466] cursor-not-allowed opacity-80'
                  : 'bg-white border-[#E3D5C5] text-[#1E1B19] focus:outline-none focus:ring-2 focus:ring-[#C88A3C]/40 focus:border-[#C88A3C]'
              }`}
            />
            {isOneDay && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#837466]">
                <Lock className="w-3.5 h-3.5 opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Presets Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
        <span className="text-[#837466] shrink-0 font-medium mr-1">Quick Dates:</span>
        <button
          type="button"
          onClick={() => applyPreset(1, 2)} // Saturday Oct 10
          className="px-2.5 py-1 rounded-lg bg-white border border-[#E3D5C5] hover:border-[#C88A3C] text-[#514538] hover:text-[#1E1B19] shrink-0 transition-colors"
        >
          Sat 1-Day (Oct 10)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(2, 2)} // Sat Oct 10 – Sun Oct 11
          className="px-2.5 py-1 rounded-lg bg-white border border-[#E3D5C5] hover:border-[#C88A3C] text-[#514538] hover:text-[#1E1B19] shrink-0 transition-colors"
        >
          This Weekend (Oct 10–11)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(3, 1)} // Fri Oct 9 – Sun Oct 11
          className="px-2.5 py-1 rounded-lg bg-white border border-[#E3D5C5] hover:border-[#C88A3C] text-[#514538] hover:text-[#1E1B19] shrink-0 transition-colors"
        >
          3-Day Weekend (Oct 9–11)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(3, 5)} // Tue Oct 13 – Thu Oct 15
          className="px-2.5 py-1 rounded-lg bg-white border border-[#E3D5C5] hover:border-[#C88A3C] text-[#514538] hover:text-[#1E1B19] shrink-0 transition-colors"
        >
          Midweek Quiet (Oct 13–15)
        </button>
      </div>

      {/* Real-Time Date & Season Dynamics Intelligence Badge */}
      {dateAnalysis && (
        <div className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
          dateAnalysis.rushLevel === 'Peak Surge' || dateAnalysis.rushLevel === 'High'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : dateAnalysis.isMidweek
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-white border-[#E3D5C5] text-[#514538]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 font-bold">
              {dateAnalysis.rushLevel === 'High' || dateAnalysis.rushLevel === 'Peak Surge' ? (
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{dateAnalysis.classification}</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-data">
              <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                dateAnalysis.rushLevel === 'High' || dateAnalysis.rushLevel === 'Peak Surge'
                  ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                  : 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
              }`}>
                Rush: {dateAnalysis.rushLevel}
              </span>
              <span className="font-semibold text-[#865302]">
                {dateAnalysis.priceMultiplier}
              </span>
            </div>
          </div>

          <p className="text-[11px] opacity-90">
            {dateAnalysis.advice}
          </p>
        </div>
      )}
    </div>
  );
};
