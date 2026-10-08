import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, X, Check, Globe } from 'lucide-react';
import { POPULAR_PLACES, PlaceItem } from '../data/places';

interface PlaceAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  iconType?: 'origin' | 'destination';
  className?: string;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Type place name...',
  iconType = 'origin',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter places based on input query
  const query = value.trim().toLowerCase();
  const suggestions = React.useMemo(() => {
    if (!query) {
      // If query is empty, prioritize relevant type (origin vs destination)
      return POPULAR_PLACES.filter(
        (p) => iconType === 'origin' ? p.type === 'origin' || p.type === 'both' : p.type === 'destination' || p.type === 'both'
      ).slice(0, 7);
    }

    return POPULAR_PLACES.filter((p) => {
      const matchName = p.name.toLowerCase().includes(query);
      const matchRegion = p.region.toLowerCase().includes(query);
      const matchCountry = p.country.toLowerCase().includes(query);
      const matchTag = p.tag.toLowerCase().includes(query);
      return matchName || matchRegion || matchCountry || matchTag;
    }).slice(0, 8);
  }, [query, iconType]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
    } else if (e.key === 'Enter') {
      if (isOpen && suggestions.length > 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (place: PlaceItem) => {
    const formatted = `${place.name}, ${place.region ? place.region + ', ' : ''}${place.country}`;
    onChange(formatted);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className} ${isOpen ? 'z-30' : 'z-10'}`}>
      <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#514538] mb-1.5">
        {label}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#865302]">
          {iconType === 'origin' ? (
            <MapPin className="w-4 h-4 text-[#865302]" />
          ) : (
            <Navigation className="w-4 h-4 text-[#865302]" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#E3D5C5] rounded-xl text-sm text-[#1E1B19] placeholder:text-[#837466]/60 focus:outline-none focus:ring-2 focus:ring-[#C88A3C]/40 focus:border-[#C88A3C] transition-all"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#837466] hover:text-[#1E1B19]"
            title="Clear field"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-[#E3D5C5] shadow-[0_12px_32px_-4px_rgba(44,38,35,0.14)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-[#E3D5C5]/60 bg-[#FAF2EE]/60 flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase text-[#865302]">
            <span>
              {query ? `Suggestions for "${value}"` : iconType === 'origin' ? 'Frequent Origins' : 'Popular Sanctuaries'}
            </span>
            <span className="text-[#837466] lowercase font-normal">
              {suggestions.length} places
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-[#E3D5C5]/40 py-1">
            {suggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#837466]">
                <Globe className="w-4 h-4 mx-auto mb-1 text-[#C88A3C] opacity-70" />
                <span>No exact preset match for "{value}". Orbit Engine will compute routing dynamically.</span>
              </div>
            ) : (
              suggestions.map((place, idx) => {
                const isSelected = value.toLowerCase().includes(place.name.toLowerCase());
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={place.id}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(place)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start justify-between gap-3 transition-colors ${
                      isHighlighted
                        ? 'bg-[#FAF2EE] text-[#1E1B19]'
                        : 'hover:bg-[#FAF2EE]/50 text-[#1E1B19]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-[#865302]">
                        {iconType === 'origin' ? (
                          <MapPin className="w-3.5 h-3.5" />
                        ) : (
                          <Navigation className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1E1B19] flex items-center gap-1.5">
                          <span>{place.name}</span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-emerald-600" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#655D59]">
                          {place.region} · {place.country}
                        </div>
                        <div className="text-[10px] text-[#865302] mt-0.5 font-medium line-clamp-1">
                          {place.tag}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
