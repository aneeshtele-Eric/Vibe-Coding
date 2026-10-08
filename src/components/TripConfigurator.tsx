import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, ArrowRightLeft, Sparkles, Navigation, Calendar, Users, SlidersHorizontal, Clock, Route, Compass } from 'lucide-react';
import { getFilteredCorridors, detectOriginHub, ALL_CORRIDORS } from '../data/presets';
import { PresetDestination } from '../types';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { DateRangePicker } from './DateRangePicker';

interface TripConfiguratorProps {
  origin: string;
  destination: string;
  dates: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  style: string;
  selectedDays: number | 'all';
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onDatesChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onTravelerCountChange: (val: number) => void;
  onStyleChange: (val: string) => void;
  onSelectedDaysChange: (days: number | 'all') => void;
  onSelectPreset: (preset: PresetDestination) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const TripConfigurator: React.FC<TripConfiguratorProps> = ({
  origin,
  destination,
  dates,
  startDate,
  endDate,
  travelerCount,
  style,
  selectedDays,
  onOriginChange,
  onDestinationChange,
  onDatesChange,
  onStartDateChange,
  onEndDateChange,
  onTravelerCountChange,
  onStyleChange,
  onSelectedDaysChange,
  onSelectPreset,
  onGenerate,
  isLoading,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>('blr-coorg');

  // Compute filtered corridors based on current Origin and selected days
  const filteredCorridors = useMemo(() => {
    return getFilteredCorridors(origin, selectedDays);
  }, [origin, selectedDays]);

  const originHub = useMemo(() => {
    return detectOriginHub(origin);
  }, [origin]);

  // Keep track of active selection or set default if current doesn't match
  useEffect(() => {
    if (filteredCorridors.length > 0) {
      const match = filteredCorridors.find((c) => c.id === activePresetId);
      if (!match) {
        setActivePresetId(filteredCorridors[0].id);
      }
    }
  }, [filteredCorridors, activePresetId]);

  const handleSwap = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  const handlePresetClick = (p: PresetDestination) => {
    setActivePresetId(p.id);
    onSelectPreset(p);
  };

  const durationOptions: Array<{ label: string; value: number | 'all'; tag: string }> = [
    { label: 'All Days', value: 'all', tag: 'Any' },
    { label: '1 Day', value: 1, tag: 'Day Escape' },
    { label: '2 Days', value: 2, tag: 'Weekend' },
    { label: '3 Days', value: 3, tag: 'Long Weekend' },
    { label: '4+ Days', value: 4, tag: 'Extended' },
  ];

  return (
    <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(44,38,35,0.06)] relative overflow-visible">
      {/* Decorative architectural background ambient accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C88A3C]/10 via-[#F4ECE8]/50 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 overflow-hidden" />

      {/* Origin & Days Based Corridors Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-[#865302] flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-[#C88A3C]" />
                Curated High-Fatigue Corridors
              </label>
              {originHub && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF8F5] text-[#865302] border border-[#E3D5C5]">
                  From {originHub}
                </span>
              )}
            </div>
            <p className="text-xs text-[#655D59] mt-0.5">
              Dynamically matched to <strong className="text-[#1E1B19]">{origin || 'Current Location'}</strong> and{' '}
              <strong className="text-[#1E1B19]">{selectedDays === 'all' ? 'All Durations' : `${selectedDays} Day${Number(selectedDays) > 1 ? 's' : ''}`}</strong>
            </p>
          </div>

          {/* Number of Days Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-white/90 rounded-xl border border-[#E3D5C5] overflow-x-auto self-start sm:self-auto">
            {durationOptions.map((opt) => {
              const isDaysActive = selectedDays === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => onSelectedDaysChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isDaysActive
                      ? 'bg-[#2C2623] text-[#FFF8F5] shadow-xs'
                      : 'text-[#655D59] hover:text-[#1E1B19] hover:bg-[#FAF2EE]'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Corridors Horizontal Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {filteredCorridors.length === 0 ? (
            <div className="w-full py-4 px-5 bg-white/70 rounded-xl border border-dashed border-[#E3D5C5] text-center text-xs text-[#655D59]">
              <span>No pre-configured corridors for this exact combination. Orbit Engine will compute a tailored route dynamically.</span>
            </div>
          ) : (
            filteredCorridors.map((p) => {
              const isSelected = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetClick(p)}
                  className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left border relative ${
                    isSelected
                      ? 'bg-[#2C2623] text-[#FFF8F5] border-[#2C2623] shadow-sm ring-1 ring-[#C88A3C]/50'
                      : 'bg-white/85 hover:bg-white text-[#514538] border-[#E3D5C5]/90 hover:border-[#C88A3C]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      {p.label}
                    </div>
                    <span
                      className={`text-[10px] font-data px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#C88A3C]/20 text-[#C88A3C] border border-[#C88A3C]/30'
                          : 'bg-[#FAF2EE] text-[#865302] border border-[#E3D5C5]'
                      }`}
                    >
                      {p.idealDays} {p.idealDays === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>

                  <div className={`text-[10px] mt-1 line-clamp-1 max-w-[240px] ${isSelected ? 'text-[#C88A3C]' : 'text-[#655D59]'}`}>
                    {p.tagline}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Origin, Destination & Configuration Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
        {/* Origin with Autocomplete Dropdown */}
        <div className="md:col-span-4">
          <PlaceAutocomplete
            label="Origin Location"
            value={origin}
            onChange={onOriginChange}
            placeholder="e.g. Bengaluru, San Francisco, London..."
            iconType="origin"
          />
        </div>

        {/* Swap button */}
        <div className="hidden md:flex md:col-span-1 justify-center pb-1">
          <button
            type="button"
            onClick={handleSwap}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F4ECE8] border border-[#E3D5C5] flex items-center justify-center text-[#655D59] hover:text-[#1E1B19] transition-all hover:rotate-180"
            title="Swap Origin and Destination"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination with Autocomplete Dropdown */}
        <div className="md:col-span-4">
          <PlaceAutocomplete
            label="Destination"
            value={destination}
            onChange={onDestinationChange}
            placeholder="e.g. Coorg, Big Sur, Hakone, Cotswolds..."
            iconType="destination"
          />
        </div>

        {/* Action Button */}
        <div className="md:col-span-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading || !origin || !destination}
            className="w-full py-2.5 px-5 rounded-xl font-medium text-sm text-[#FFF8F5] bg-[#2C2623] hover:bg-[#1E1B19] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_-2px_rgba(44,38,35,0.2)] transition-all flex items-center justify-center gap-2 border border-[#E3D5C5]/20"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#C88A3C] border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Traffic & Crowds...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C88A3C]" />
                <span>Engage Orbit Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secondary filter parameters: Date Range Picker & Party Settings */}
      <div className="mt-5 pt-5 border-t border-[#E3D5C5]/70 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        {/* Date Range Picker with 1-Day Disabled End Date & Real-Time Rush Intelligence */}
        <div className="lg:col-span-7 bg-white/70 p-4 rounded-xl border border-[#E3D5C5]/80">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            durationDays={selectedDays}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onDurationChange={onSelectedDaysChange}
          />
        </div>

        {/* Party Size & Sentiment / Pace Mode */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 bg-white/70 p-4 rounded-xl border border-[#E3D5C5]/80">
          <div>
            <span className="text-[#655D59] font-medium flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-[#865302]" />
              Party Size:
            </span>
            <select
              value={travelerCount}
              onChange={(e) => onTravelerCountChange(Number(e.target.value))}
              className="w-full py-2 px-3 bg-white border border-[#E3D5C5] rounded-lg text-xs text-[#1E1B19] focus:outline-none focus:border-[#C88A3C]"
            >
              <option value={1}>1 Solo Seeker</option>
              <option value={2}>2 Adults (Couple / Sanctuary)</option>
              <option value={4}>4 Friends / Small Group</option>
              <option value={5}>Family (Low-intensity)</option>
            </select>
          </div>

          <div>
            <span className="text-[#655D59] font-medium flex items-center gap-1.5 mb-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#865302]" />
              Sentiment & Pace Mode:
            </span>
            <select
              value={style}
              onChange={(e) => onStyleChange(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-[#E3D5C5] rounded-lg text-xs text-[#1E1B19] focus:outline-none focus:border-[#C88A3C]"
            >
              <option value="Serene Retreat (Anti-Tourist Trap)">Serene Retreat (Anti-Tourist Trap)</option>
              <option value="Architectural & Heritage Immersion">Architectural & Heritage Immersion</option>
              <option value="Slow Food & Single-Origin Epicurean">Slow Food & Epicurean</option>
              <option value="Total Passive Unplugged Downtime">Total Unplugged Downtime</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
