import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Eye, CheckCircle2, Shuffle, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { ItineraryItem } from '../types';

interface ItineraryTimelineProps {
  itinerary: ItineraryItem[];
  onSwapActivity?: (index: number) => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  itinerary,
  onSwapActivity,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  // Group items by day
  const days = Array.from(new Set(itinerary.map((item) => item.day))).sort();

  const filteredItems =
    selectedDay === 'all'
      ? itinerary
      : itinerary.filter((item) => item.day === selectedDay);

  const toggleComplete = (idx: number) => {
    setCompletedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getCrowdBadge = (level: string) => {
    const l = level.toLowerCase();
    if (l === 'low') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Low Crowd · Serene
        </span>
      );
    }
    if (l === 'moderate') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECE0DB] text-[#6B635F] border border-[#D6C3B2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#865302]" />
          Moderate Crowd
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
        High Crowd · Peak Alert
      </span>
    );
  };

  return (
    <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(44,38,35,0.06)] relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
              Decisive Chronology · Anti-Tourist Trap
            </span>
            <h3 className="text-base font-bold text-[#1E1B19]">
              Visual Itinerary & Crowd Schedule
            </h3>
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E3D5C5]">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedDay === 'all'
                ? 'bg-[#2C2623] text-[#FFF8F5] shadow-2xs'
                : 'text-[#655D59] hover:text-[#1E1B19]'
            }`}
          >
            All Days ({itinerary.length})
          </button>
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedDay === d
                  ? 'bg-[#2C2623] text-[#FFF8F5] shadow-2xs'
                  : 'text-[#655D59] hover:text-[#1E1B19]'
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline items list */}
      <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E3D5C5]">
        {filteredItems.map((item, idx) => {
          const isDone = !!completedItems[idx];
          return (
            <div
              key={idx}
              className={`relative bg-white rounded-xl border transition-all p-4 sm:p-5 shadow-2xs ${
                isDone
                  ? 'border-[#E3D5C5]/50 opacity-70 bg-[#F4ECE8]/50'
                  : 'border-[#E3D5C5] hover:border-[#C88A3C]/60 hover:shadow-sm'
              }`}
            >
              {/* Timeline marker pin */}
              <button
                onClick={() => toggleComplete(idx)}
                className={`absolute -left-8 sm:-left-9 top-5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FFF8F5] border-2 border-[#C88A3C] text-[#865302] hover:bg-[#C88A3C] hover:text-white'
                }`}
                title={isDone ? 'Marked visited' : 'Click to mark visited'}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.day}
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-data text-xs font-semibold text-[#865302] bg-[#FFF8F5] px-2.5 py-1 rounded-md border border-[#E3D5C5]">
                    {item.time}
                  </span>
                  <span className="text-xs text-[#837466] font-medium">
                    Day {item.day}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getCrowdBadge(item.crowd_level)}
                </div>
              </div>

              <h4 className="text-base font-bold text-[#1E1B19] mb-1.5">
                {item.activity}
              </h4>

              {/* Serene / Anti-tourist-trap notes */}
              <div className="bg-[#FAF2EE] p-3 rounded-lg border border-[#E3D5C5]/60 text-xs text-[#514538] leading-relaxed mt-2 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C88A3C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#865302]">Autonomous Rationale: </span>
                  {item.notes}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
