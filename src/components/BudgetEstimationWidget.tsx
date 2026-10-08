import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BedDouble,
  Compass,
  Utensils,
  Fuel,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Users,
  Calendar,
  Sparkles,
  Info,
  DollarSign,
  Receipt,
  Car
} from 'lucide-react';
import { OrbitPlan, SeasonalDynamics } from '../types';

interface BudgetEstimationWidgetProps {
  plan: OrbitPlan;
  travelerCount: number;
  durationDays: number | 'all';
  startDate?: string;
  endDate?: string;
  datesDescriptor?: string;
  onUpdateTravelerCount?: (count: number) => void;
}

type SpendingTier = 'prudent' | 'comfort' | 'luxury';

interface InferredActivityCost {
  day: number;
  time: string;
  activity: string;
  category: 'Experience' | 'Tasting' | 'Dining' | 'Transit' | 'Lodging' | 'Complimentary';
  estimatedCostPerPerson: number;
  totalPartyCost: number;
  isIncludedInLodging: boolean;
  rationale: string;
}

export const BudgetEstimationWidget: React.FC<BudgetEstimationWidgetProps> = ({
  plan,
  travelerCount: initialTravelers,
  durationDays,
  startDate,
  endDate,
  datesDescriptor,
  onUpdateTravelerCount,
}) => {
  const [spendingTier, setSpendingTier] = useState<SpendingTier>('comfort');
  const [internalTravelers, setInternalTravelers] = useState<number>(initialTravelers || 2);
  const [showItemized, setShowItemized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [roomOverride, setRoomOverride] = useState<number | null>(null);

  // Sync internal travelers if prop changes
  React.useEffect(() => {
    if (initialTravelers && initialTravelers !== internalTravelers) {
      setInternalTravelers(initialTravelers);
    }
  }, [initialTravelers]);

  const activeTravelers = internalTravelers;

  // 1. Calculate Nights
  const calculatedNights = useMemo(() => {
    if (durationDays === 1) return 0; // Same-day escape
    if (typeof durationDays === 'number' && durationDays > 1) {
      return durationDays - 1;
    }
    if (startDate && endDate) {
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      const diff = Math.round(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    }
    return 2; // Default weekend 3-day / 2-night trip
  }, [durationDays, startDate, endDate]);

  const calculatedDays = useMemo(() => {
    if (durationDays === 1) return 1;
    if (typeof durationDays === 'number') return durationDays;
    return calculatedNights + 1;
  }, [durationDays, calculatedNights]);

  // 2. Parse Hotel Price & Currency
  const parsedLodging = useMemo(() => {
    const rawPrice = plan.hotel_recommendation?.best_price || '₹18,000 / night';
    let currencySymbol = '₹';
    let currencyCode = 'INR';

    if (rawPrice.includes('$')) {
      currencySymbol = '$';
      currencyCode = 'USD';
    } else if (rawPrice.includes('€')) {
      currencySymbol = '€';
      currencyCode = 'EUR';
    } else if (rawPrice.includes('£')) {
      currencySymbol = '£';
      currencyCode = 'GBP';
    }

    // Extract digits
    const cleaned = rawPrice.replace(/[^\d.]/g, '');
    const baseNightlyRate = parseFloat(cleaned) || (currencySymbol === '₹' ? 18000 : 250);

    // Tier Multipliers
    let tierNightlyRate = baseNightlyRate;
    if (spendingTier === 'prudent') {
      tierNightlyRate = Math.round(baseNightlyRate * 0.78);
    } else if (spendingTier === 'luxury') {
      tierNightlyRate = Math.round(baseNightlyRate * 1.35);
    }

    // Room Count: 1-2 travelers = 1 room, 3-4 = 2 rooms, etc.
    const defaultRooms = calculatedNights === 0 ? 0 : Math.ceil(activeTravelers / 2);
    const roomsCount = calculatedNights === 0 ? 0 : (roomOverride !== null ? roomOverride : defaultRooms);

    const totalLodgingCost = calculatedNights === 0 ? 0 : tierNightlyRate * calculatedNights * roomsCount;

    return {
      rawPrice,
      currencySymbol,
      currencyCode,
      baseNightlyRate,
      tierNightlyRate,
      roomsCount,
      totalLodgingCost,
    };
  }, [plan.hotel_recommendation?.best_price, spendingTier, calculatedNights, activeTravelers, roomOverride]);

  const { currencySymbol } = parsedLodging;
  const isINR = currencySymbol === '₹';

  // 3. Infer Activity Costs from Itinerary
  const inferredActivities = useMemo<InferredActivityCost[]>(() => {
    const items = plan.itinerary || [];
    return items.map((item) => {
      const text = `${item.activity} ${item.notes}`.toLowerCase();

      // Check if it's pure transit or rest
      if (
        text.includes('departure') ||
        text.includes('wheels-up') ||
        text.includes('transit') ||
        text.includes('drive') ||
        text.includes('return')
      ) {
        return {
          day: item.day,
          time: item.time,
          activity: item.activity,
          category: 'Transit',
          estimatedCostPerPerson: 0,
          totalPartyCost: 0,
          isIncludedInLodging: false,
          rationale: 'Covered under arterial mobility & highway fuel budget',
        };
      }

      if (
        text.includes('check-in') ||
        text.includes('arrival & check') ||
        text.includes('unpack') ||
        text.includes('verandah') ||
        text.includes('downtime') ||
        text.includes('reading') ||
        text.includes('restoration') ||
        text.includes('porch') ||
        text.includes('unwind')
      ) {
        return {
          day: item.day,
          time: item.time,
          activity: item.activity,
          category: 'Lodging',
          estimatedCostPerPerson: 0,
          totalPartyCost: 0,
          isIncludedInLodging: true,
          rationale: 'Complimentary private sanctuary amenity included with stay',
        };
      }

      // Dining / Meals
      if (
        text.includes('breakfast') ||
        text.includes('lunch') ||
        text.includes('dinner') ||
        text.includes('dining') ||
        text.includes('curry') ||
        text.includes('cafe') ||
        text.includes('aperitif')
      ) {
        const base = isINR ? 850 : 35;
        const multiplier = spendingTier === 'luxury' ? 1.5 : spendingTier === 'prudent' ? 0.7 : 1.0;
        const perPerson = Math.round(base * multiplier);
        return {
          day: item.day,
          time: item.time,
          activity: item.activity,
          category: 'Dining',
          estimatedCostPerPerson: perPerson,
          totalPartyCost: perPerson * activeTravelers,
          isIncludedInLodging: false,
          rationale: 'Artisanal regional meal or curated dining stop',
        };
      }

      // Tasting / Cupping / Artisan Workshop
      if (
        text.includes('cupping') ||
        text.includes('tasting') ||
        text.includes('workshop') ||
        text.includes('procurement') ||
        text.includes('demonstration') ||
        text.includes('honey') ||
        text.includes('spice') ||
        text.includes('coffee bean')
      ) {
        const base = isINR ? 1200 : 45;
        const multiplier = spendingTier === 'luxury' ? 1.4 : spendingTier === 'prudent' ? 0.75 : 1.0;
        const perPerson = Math.round(base * multiplier);
        return {
          day: item.day,
          time: item.time,
          activity: item.activity,
          category: 'Tasting',
          estimatedCostPerPerson: perPerson,
          totalPartyCost: perPerson * activeTravelers,
          isIncludedInLodging: false,
          rationale: 'Specialist tasting session, farm-gate demo, or cupping laboratory fee',
        };
      }

      // Nature Safari / Kayaking / Birding / Trails
      if (
        text.includes('safari') ||
        text.includes('kayak') ||
        text.includes('birding') ||
        text.includes('naturalist') ||
        text.includes('trail') ||
        text.includes('ridge') ||
        text.includes('canopy') ||
        text.includes('ascent') ||
        text.includes('trek')
      ) {
        const base = isINR ? 1400 : 50;
        const multiplier = spendingTier === 'luxury' ? 1.6 : spendingTier === 'prudent' ? 0.7 : 1.0;
        const perPerson = Math.round(base * multiplier);
        return {
          day: item.day,
          time: item.time,
          activity: item.activity,
          category: 'Experience',
          estimatedCostPerPerson: perPerson,
          totalPartyCost: perPerson * activeTravelers,
          isIncludedInLodging: false,
          rationale: 'Resident naturalist guide, private trail pass, or eco-reserve access',
        };
      }

      // Default Experience
      const base = isINR ? 600 : 25;
      const multiplier = spendingTier === 'luxury' ? 1.3 : spendingTier === 'prudent' ? 0.8 : 1.0;
      const perPerson = Math.round(base * multiplier);
      return {
        day: item.day,
        time: item.time,
        activity: item.activity,
        category: 'Experience',
        estimatedCostPerPerson: perPerson,
        totalPartyCost: perPerson * activeTravelers,
        isIncludedInLodging: false,
        rationale: 'Curated local excursion or sanctuary cultural entry',
      };
    });
  }, [plan.itinerary, isINR, spendingTier, activeTravelers]);

  // 4. Subtotals for Activities & Dining
  const activitiesSubtotal = useMemo(() => {
    return inferredActivities
      .filter((a) => a.category === 'Experience' || a.category === 'Tasting')
      .reduce((sum, a) => sum + a.totalPartyCost, 0);
  }, [inferredActivities]);

  const itineraryDiningSubtotal = useMemo(() => {
    return inferredActivities
      .filter((a) => a.category === 'Dining')
      .reduce((sum, a) => sum + a.totalPartyCost, 0);
  }, [inferredActivities]);

  // General dining per diem for remaining meals (assuming breakfast at lodge, lunches & snacks)
  const baseDailyDiningPerPerson = isINR ? 1200 : 55;
  const diningTierMultiplier = spendingTier === 'luxury' ? 1.6 : spendingTier === 'prudent' ? 0.75 : 1.0;
  const estimatedDailyDining = Math.round(baseDailyDiningPerPerson * diningTierMultiplier * activeTravelers * calculatedDays);
  // Total Dining budget blends itemized and general provisioning
  const totalDiningCost = Math.max(itineraryDiningSubtotal, estimatedDailyDining);

  // 5. Transit & Mobility Costs (Fuel + Expressway Tolls)
  const transitCost = useMemo(() => {
    const oneWayKm = plan.departure_advice?.total_distance_km || 250;
    const roundTripKm = oneWayKm * 2;

    if (isINR) {
      // ~₹7.5/km fuel + expressway tolls (~₹650)
      const fuel = Math.round(roundTripKm * 7.5);
      const tolls = Math.round(roundTripKm > 200 ? 700 : 350);
      const tierMod = spendingTier === 'luxury' ? 1.25 : 1.0;
      return Math.round((fuel + tolls) * tierMod);
    } else {
      // ~$0.18/mile (~$0.11/km) fuel + $30 tolls
      const fuel = Math.round(roundTripKm * 0.12);
      const tolls = 35;
      const tierMod = spendingTier === 'luxury' ? 1.3 : 1.0;
      return Math.round((fuel + tolls) * tierMod);
    }
  }, [plan.departure_advice?.total_distance_km, isINR, spendingTier]);

  // 6. Subtotal & Contingency Buffer (8%)
  const coreSubtotal = parsedLodging.totalLodgingCost + activitiesSubtotal + totalDiningCost + transitCost;
  const contingencyCost = Math.round(coreSubtotal * 0.08); // 8% buffer for farm-gate purchases, tips, unforeseen tolls
  const totalEstimatedTripCost = coreSubtotal + contingencyCost;

  // Metrics
  const costPerTraveler = Math.round(totalEstimatedTripCost / activeTravelers);
  const costPerDiem = Math.round(totalEstimatedTripCost / Math.max(1, calculatedDays));

  // Allocation Percentages
  const lodgingPct = totalEstimatedTripCost > 0 ? Math.round((parsedLodging.totalLodgingCost / totalEstimatedTripCost) * 100) : 0;
  const activitiesPct = totalEstimatedTripCost > 0 ? Math.round((activitiesSubtotal / totalEstimatedTripCost) * 100) : 0;
  const diningPct = totalEstimatedTripCost > 0 ? Math.round((totalDiningCost / totalEstimatedTripCost) * 100) : 0;
  const transitPct = totalEstimatedTripCost > 0 ? Math.round((transitCost / totalEstimatedTripCost) * 100) : 0;
  const contingencyPct = totalEstimatedTripCost > 0 ? Math.max(1, 100 - lodgingPct - activitiesPct - diningPct - transitPct) : 0;

  // Format Helper
  const fmt = (num: number) => {
    return `${currencySymbol}${num.toLocaleString('en-US')}`;
  };

  // Copy Summary to Clipboard
  const handleCopyBudget = () => {
    const textSummary = `=========================================
THE ORBIT TRAVEL INTELLIGENCE: TRIP BUDGET ESTIMATION
Destination: ${plan.hotel_recommendation?.name || 'Sanctuary Stay'}
Travelers: ${activeTravelers} Guest${activeTravelers > 1 ? 's' : ''} | Duration: ${calculatedDays} Days (${calculatedNights} Nights)
Tier: ${spendingTier.toUpperCase()}
=========================================
TOTAL ESTIMATED OUTLAY: ${fmt(totalEstimatedTripCost)}
Per Traveler: ${fmt(costPerTraveler)}
Daily Average: ${fmt(costPerDiem)} / day

BREAKDOWN OF SPENDING:
1. Sanctuary Lodging: ${fmt(parsedLodging.totalLodgingCost)} (${lodgingPct}%)
   - Rate: ${fmt(parsedLodging.tierNightlyRate)} / night × ${calculatedNights} night${calculatedNights > 1 ? 's' : ''} × ${parsedLodging.roomsCount} room(s)
2. Inferred Experiences: ${fmt(activitiesSubtotal)} (${activitiesPct}%)
   - ${inferredActivities.filter(a => a.totalPartyCost > 0).length} activities across ${calculatedDays} days
3. Dining & Provisions: ${fmt(totalDiningCost)} (${diningPct}%)
4. Transit & Express Tolls: ${fmt(transitCost)} (${transitPct}%)
   - Round-trip road transit (${(plan.departure_advice?.total_distance_km || 250) * 2} km)
5. Contingency & Gratuities (8%): ${fmt(contingencyCost)} (${contingencyPct}%)
=========================================`;

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTravelerChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(8, newCount));
    setInternalTravelers(clamped);
    if (onUpdateTravelerCount) {
      onUpdateTravelerCount(clamped);
    }
  };

  return (
    <div className="bg-[#FAF5EE] rounded-xl border border-[#E3D5C5] p-5 sm:p-6 shadow-xs relative transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3D5C5]/80">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
                Executive Intelligence · Financial Physics
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EFE3D5] text-[#514538] text-[10px] font-medium border border-[#DECFC0]">
                Live Synthesized
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1E1B19] font-editorial flex items-center gap-2">
              Estimated Trip Budget & Outlay Breakdown
            </h3>
          </div>
        </div>

        {/* Spending Tier Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-[#DECFC0] shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setSpendingTier('prudent')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              spendingTier === 'prudent'
                ? 'bg-[#2C2623] text-[#FFF8F5] shadow-2xs'
                : 'text-[#655D59] hover:text-[#1E1B19]'
            }`}
            title="Prudent Value: Standard estate rooms, core experiences"
          >
            Prudent
          </button>
          <button
            onClick={() => setSpendingTier('comfort')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              spendingTier === 'comfort'
                ? 'bg-[#865302] text-[#FFF8F5] shadow-2xs'
                : 'text-[#655D59] hover:text-[#1E1B19]'
            }`}
            title="Curated Comfort: Default planned experience"
          >
            Curated (Recommended)
          </button>
          <button
            onClick={() => setSpendingTier('luxury')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              spendingTier === 'luxury'
                ? 'bg-[#2C2623] text-[#C88A3C] shadow-2xs'
                : 'text-[#655D59] hover:text-[#1E1B19]'
            }`}
            title="Luxury Reserve: Premium private naturalist, upgraded suites & wine pairings"
          >
            Reserve
          </button>
        </div>
      </div>

      {/* Main Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
        {/* Total Outlay */}
        <div className="bg-white p-4 rounded-xl border border-[#E3D5C5] shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-[#865302] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Total Outlay</span>
            <Receipt className="w-3.5 h-3.5 text-[#C88A3C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-data text-[#1E1B19] tracking-tight">
            {fmt(totalEstimatedTripCost)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#655D59]">
            <span className="font-semibold text-[#865302]">{calculatedDays} Days / {calculatedNights} Nights</span>
            <span>·</span>
            <span>Party of {activeTravelers}</span>
          </div>
        </div>

        {/* Cost Per Traveler */}
        <div className="bg-white p-4 rounded-xl border border-[#E3D5C5] shadow-2xs">
          <div className="flex items-center justify-between text-[#865302] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Per Traveler Share</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleTravelerChange(activeTravelers - 1)}
                className="w-4 h-4 rounded bg-[#FAF2EE] hover:bg-[#EAE0D5] text-[#514538] text-[10px] font-bold flex items-center justify-center transition-colors border border-[#DECFC0]"
                title="Decrease travelers"
              >
                -
              </button>
              <span className="text-[10px] font-semibold text-[#1E1B19] px-1">{activeTravelers}</span>
              <button
                onClick={() => handleTravelerChange(activeTravelers + 1)}
                className="w-4 h-4 rounded bg-[#FAF2EE] hover:bg-[#EAE0D5] text-[#514538] text-[10px] font-bold flex items-center justify-center transition-colors border border-[#DECFC0]"
                title="Increase travelers"
              >
                +
              </button>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-data text-[#1E1B19] tracking-tight">
            {fmt(costPerTraveler)}
          </div>
          <div className="text-[11px] text-[#655D59] mt-1.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#C88A3C]" />
            <span>Inclusive of lodging, experiences & meals</span>
          </div>
        </div>

        {/* Daily Per Diem Average */}
        <div className="bg-white p-4 rounded-xl border border-[#E3D5C5] shadow-2xs">
          <div className="flex items-center justify-between text-[#865302] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Per Diem Burn Rate</span>
            <Calendar className="w-3.5 h-3.5 text-[#C88A3C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-data text-[#1E1B19] tracking-tight">
            {fmt(costPerDiem)}
            <span className="text-xs text-[#837466] font-normal ml-1">/ day</span>
          </div>
          <div className="text-[11px] text-[#655D59] mt-1.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Includes 8% unscripted contingency</span>
          </div>
        </div>
      </div>

      {/* Visual Spending Allocation Multi-Bar */}
      <div className="mt-4 pt-4 border-t border-[#E3D5C5]/70">
        <div className="flex items-center justify-between text-xs font-semibold text-[#514538] mb-1.5">
          <span className="text-[11px] text-[#865302] uppercase tracking-wider">Capital Allocation Distribution</span>
          <span className="text-[11px] font-data text-[#837466]">100% Itemized Model</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 w-full rounded-full bg-[#E5D7C7] overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${lodgingPct}%` }}
            className="bg-[#C88A3C] h-full transition-all duration-500 hover:opacity-90"
            title={`Sanctuary Lodging: ${lodgingPct}% (${fmt(parsedLodging.totalLodgingCost)})`}
          />
          <div
            style={{ width: `${activitiesPct}%` }}
            className="bg-[#059669] h-full transition-all duration-500 hover:opacity-90"
            title={`Inferred Activities: ${activitiesPct}% (${fmt(activitiesSubtotal)})`}
          />
          <div
            style={{ width: `${diningPct}%` }}
            className="bg-[#D97706] h-full transition-all duration-500 hover:opacity-90"
            title={`Dining & Provisions: ${diningPct}% (${fmt(totalDiningCost)})`}
          />
          <div
            style={{ width: `${transitPct}%` }}
            className="bg-[#2563EB] h-full transition-all duration-500 hover:opacity-90"
            title={`Transit & Tolls: ${transitPct}% (${fmt(transitCost)})`}
          />
          <div
            style={{ width: `${contingencyPct}%` }}
            className="bg-[#7C3AED] h-full transition-all duration-500 hover:opacity-90"
            title={`Contingency Buffer: ${contingencyPct}% (${fmt(contingencyCost)})`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[11px] text-[#655D59]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C88A3C]" />
            <span className="font-medium text-[#1E1B19]">Lodging:</span>
            <span>{lodgingPct}% ({fmt(parsedLodging.totalLodgingCost)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <span className="font-medium text-[#1E1B19]">Experiences:</span>
            <span>{activitiesPct}% ({fmt(activitiesSubtotal)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            <span className="font-medium text-[#1E1B19]">Dining:</span>
            <span>{diningPct}% ({fmt(totalDiningCost)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span className="font-medium text-[#1E1B19]">Transit & Tolls:</span>
            <span>{transitPct}% ({fmt(transitCost)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span className="font-medium text-[#1E1B19]">Contingency:</span>
            <span>{contingencyPct}% ({fmt(contingencyCost)})</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#E3D5C5]/70">
        {/* Category 1: Lodging */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3D5C5] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-[#1E1B19]">
              <BedDouble className="w-4 h-4 text-[#C88A3C]" />
              <span>Sanctuary Lodging Tariff</span>
            </div>
            <span className="font-data font-bold text-sm text-[#1E1B19]">
              {fmt(parsedLodging.totalLodgingCost)}
            </span>
          </div>
          <p className="text-[#655D59] leading-relaxed mb-2">
            {plan.hotel_recommendation?.name || 'Curated boutique estate'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-2 border-t border-[#FAF2EE] text-[#837466]">
            <span>
              {calculatedNights === 0 ? (
                <span className="text-emerald-700 font-semibold">Single-Day Turnaround ($0 Overnight)</span>
              ) : (
                `${fmt(parsedLodging.tierNightlyRate)} / night × ${calculatedNights} night${calculatedNights > 1 ? 's' : ''} (${parsedLodging.roomsCount} room${parsedLodging.roomsCount > 1 ? 's' : ''})`
              )}
            </span>
            <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
              Rate Match Guarantee
            </span>
          </div>
        </div>

        {/* Category 2: Inferred Activities */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3D5C5] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-[#1E1B19]">
              <Compass className="w-4 h-4 text-[#059669]" />
              <span>Inferred Travel Experiences</span>
            </div>
            <span className="font-data font-bold text-sm text-[#1E1B19]">
              {fmt(activitiesSubtotal)}
            </span>
          </div>
          <p className="text-[#655D59] leading-relaxed mb-2">
            Synthesized from {inferredActivities.length} itinerary waypoints (tastings, guided trails & eco-passes)
          </p>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-2 border-t border-[#FAF2EE] text-[#837466]">
            <span>
              {inferredActivities.filter((a) => a.totalPartyCost > 0).length} paid experiences + {inferredActivities.filter((a) => a.totalPartyCost === 0).length} in-house/scenic
            </span>
            <button
              onClick={() => setShowItemized(!showItemized)}
              className="text-[#865302] hover:text-[#514538] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              {showItemized ? 'Hide line items' : 'View line items'}
            </button>
          </div>
        </div>

        {/* Category 3: Dining & Provisions */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3D5C5] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-[#1E1B19]">
              <Utensils className="w-4 h-4 text-[#D97706]" />
              <span>Artisanal Dining & Provisions</span>
            </div>
            <span className="font-data font-bold text-sm text-[#1E1B19]">
              {fmt(totalDiningCost)}
            </span>
          </div>
          <p className="text-[#655D59] leading-relaxed mb-2">
            Farm-to-table regional lunches, coffee breaks, and estate evening culinary specialties
          </p>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-2 border-t border-[#FAF2EE] text-[#837466]">
            <span>Est. ~{fmt(Math.round(totalDiningCost / (activeTravelers * calculatedDays)))} / person / day</span>
            <span className="text-[#865302] font-medium text-[10px]">Filtered away from tourist spots</span>
          </div>
        </div>

        {/* Category 4: Transit Physics & Tolls */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3D5C5] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-bold text-[#1E1B19]">
              <Car className="w-4 h-4 text-[#2563EB]" />
              <span>Transit, Fuel & Express Tolls</span>
            </div>
            <span className="font-data font-bold text-sm text-[#1E1B19]">
              {fmt(transitCost)}
            </span>
          </div>
          <p className="text-[#655D59] leading-relaxed mb-2">
            Round-trip corridor {(plan.departure_advice?.total_distance_km || 250) * 2} km transit + expressway FASTag/tolls
          </p>
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-2 border-t border-[#FAF2EE] text-[#837466]">
            <span>Route: {plan.departure_advice?.route?.split('→')[0]?.trim() || 'Dawn Arterial'}</span>
            <span className="text-emerald-800 font-medium text-[10px]">Dawn Traffic Multiplier 1.0x</span>
          </div>
        </div>
      </div>

      {/* Itemized Inferred Activities Accordion */}
      {showItemized && (
        <div className="mt-4 pt-4 border-t border-[#DECFC0] bg-white rounded-xl p-4 border shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#865302]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1B19]">
                Itemized Inferred Activity Tariffs ({inferredActivities.length} Waypoints)
              </h4>
            </div>
            <span className="text-[11px] text-[#837466]">
              Calculated for {activeTravelers} traveler{activeTravelers > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-[#F2E8DC] text-xs">
            {inferredActivities.map((act, idx) => (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF5EE]/60 px-2 rounded-lg transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF2EE] border border-[#DECFC0] text-[10px] font-bold text-[#865302] shrink-0 mt-0.5">
                    Day {act.day} · {act.time}
                  </span>
                  <div>
                    <div className="font-semibold text-[#1E1B19] flex items-center gap-2">
                      <span>{act.activity}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                        act.category === 'Dining'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : act.category === 'Tasting'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : act.category === 'Experience'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : act.category === 'Lodging'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}>
                        {act.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#655D59] mt-0.5">{act.rationale}</p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  {act.totalPartyCost === 0 ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Complimentary / In-House
                    </span>
                  ) : (
                    <div>
                      <span className="font-data font-bold text-xs text-[#1E1B19]">
                        {fmt(act.totalPartyCost)}
                      </span>
                      <span className="text-[10px] text-[#837466] block">
                        ({fmt(act.estimatedCostPerPerson)} / person)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls & Copy Action */}
      <div className="mt-4 pt-3.5 border-t border-[#E3D5C5]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#655D59]">
          <Info className="w-3.5 h-3.5 text-[#C88A3C] shrink-0" />
          <span className="text-[11px]">
            Includes 8% unscripted contingency reserve ({fmt(contingencyCost)}) for spontaneous artisanal purchases and off-grid gratuities.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowItemized(!showItemized)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F4ECE8] text-[#514538] border border-[#DECFC0] text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            {showItemized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>{showItemized ? 'Collapse Line Items' : 'Inspect Line Items'}</span>
          </button>

          <button
            onClick={handleCopyBudget}
            className="px-3 py-1.5 rounded-lg bg-[#2C2623] hover:bg-[#1E1B19] active:scale-[0.98] text-[#FFF8F5] text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[#C88A3C]" />
                <span>Copy Budget Summary</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
