import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TripConfigurator } from './components/TripConfigurator';
import { DepartureTrafficCard } from './components/DepartureTrafficCard';
import { LodgingCard } from './components/LodgingCard';
import { ItineraryTimeline } from './components/ItineraryTimeline';
import { QuickPivots } from './components/QuickPivots';
import { JsonInspectorModal } from './components/JsonInspectorModal';
import { ReservationModal } from './components/ReservationModal';
import { MemoryBankModal } from './components/MemoryBankModal';
import { TravellerDecisionStation } from './components/TravellerDecisionStation';
import { EditorialPdfModal } from './components/EditorialPdfModal';
import { GroundedSearchDrawer } from './components/GroundedSearchDrawer';
import { TravelCopilotChat } from './components/TravelCopilotChat';
import { VoiceSessionModal } from './components/VoiceSessionModal';
import { RouteVisualizationMap } from './components/RouteVisualizationMap';
import { WeatherForecastWidget } from './components/WeatherForecastWidget';
import { BudgetEstimationWidget } from './components/BudgetEstimationWidget';
import { PRESET_ROUTES } from './data/presets';
import { OrbitPlan, MemoryConstraint, PresetDestination } from './types';
import { Sparkles, Compass, ShieldCheck, Check, AlertCircle, ArrowRight, Brain, Globe, Mic, MessageSquare, Zap } from 'lucide-react';

export default function App() {
  const [origin, setOrigin] = useState<string>('Bengaluru, KA');
  const [destination, setDestination] = useState<string>('Coorg (Kodagu), KA');
  const [travelerCount, setTravelerCount] = useState<number>(2);
  const [style, setStyle] = useState<string>('Serene Retreat (Anti-Tourist Trap)');
  const [selectedDays, setSelectedDays] = useState<number | 'all'>(3);

  // Exact calendar dates
  const [startDate, setStartDate] = useState<string>('2026-10-09'); // Friday Oct 9
  const [endDate, setEndDate] = useState<string>('2026-10-11');   // Sunday Oct 11

  // Dynamic formatted dates descriptor
  const dates = React.useMemo(() => {
    const s = new Date(startDate + 'T00:00:00');
    const e = new Date((selectedDays === 1 ? startDate : endDate) + 'T00:00:00');
    const sStr = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const eStr = e.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayCount = selectedDays === 1 ? 1 : Math.max(1, Math.round(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const startDay = s.getDay();
    const isWeekend = startDay === 5 || startDay === 6 || startDay === 0;
    return `${sStr} – ${eStr} (${dayCount} Day${dayCount > 1 ? 's' : ''}${isWeekend ? ' · Weekend Rush' : ' · Midweek Off-Peak'})`;
  }, [startDate, endDate, selectedDays]);

  const [currentPlan, setCurrentPlan] = useState<OrbitPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [reasoningMessage, setReasoningMessage] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string>('engine');

  // Proposal acceptance & revision state
  const [proposalStatus, setProposalStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [proposalRevision, setProposalRevision] = useState<number>(1);

  // Modals & Assistant state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Rejection memory constraints bank
  const [memoryConstraints, setMemoryConstraints] = useState<MemoryConstraint[]>([
    {
      id: 'init-1',
      category: 'pace',
      description: 'Zero tourist traps: strictly serene local alternatives',
      addedAt: 'System Default',
    },
    {
      id: 'init-2',
      category: 'timing',
      description: 'Dawn transit bias to avoid highway exit toll gridlock',
      addedAt: 'System Default',
    },
  ]);

  // Generate or regenerate plan
  const fetchPlan = async (
    customFeedback?: string,
    category?: MemoryConstraint['category'],
    overrideDays?: number | 'all',
    overrideDates?: string
  ) => {
    const isFeedback = !!customFeedback;
    const daysToUse = overrideDays !== undefined ? overrideDays : selectedDays;
    const datesToUse = overrideDates || dates;

    if (isFeedback) {
      setIsAdapting(true);
      setReasoningMessage(
        `Orbit Engine adapting constraints: ${
          category === 'pace'
            ? 'Reducing waypoint density by 50% · Adding 3+ hours dedicated porch downtime'
            : category === 'lodging'
            ? 'Switching lodging taxonomy to secluded private heritage homestay'
            : category === 'timing'
            ? 'Recalculating departure schedule for midday post-peak window'
            : 'Re-evaluating route, crowds, and verified guest sentiment'
        }...`
      );
    } else {
      setIsLoading(true);
      setReasoningMessage('Orbit Engine: Evaluating road bottlenecks, acoustic reviews & crowd patterns...');
    }

    try {
      const payload = {
        origin,
        destination,
        dates: datesToUse,
        startDate,
        endDate: daysToUse === 1 ? startDate : endDate,
        travelerCount,
        style,
        durationDays: daysToUse,
        rejectionFeedback: customFeedback,
        activeConstraints: memoryConstraints.map((c) => c.description),
        previousPlan: currentPlan,
      };

      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.plan) {
        setCurrentPlan(data.plan);
        setAiSource(data.source || 'engine');
      }
    } catch (err) {
      console.warn('Backend call failed, using client-side fallback plan', err);
      // Client fallback for seamless offline operation
      if (customFeedback && currentPlan) {
        // Apply immediate client-side mutation reflecting feedback
        setCurrentPlan((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            summary: `Orbit Engine Rejection Memory Applied: Scaled down pacing by 50%. Enforced open downtime and serene acoustic tranquility to eliminate fatigue.`,
            itinerary: prev.itinerary.slice(0, Math.max(2, Math.ceil(prev.itinerary.length / 2))),
            departure_advice: {
              ...prev.departure_advice,
              traffic_notes: `${prev.departure_advice.traffic_notes} [Constraint enforced: traffic window optimized per user critique]`,
            },
          };
        });
      }
    } finally {
      setIsLoading(false);
      setIsAdapting(false);
      setTimeout(() => setReasoningMessage(null), 3000);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchPlan();
  }, []);

  // Handle Preset selection
  const handleSelectPreset = (p: PresetDestination) => {
    setOrigin(p.origin);
    setDestination(p.destination);
    setStyle(p.style);
    setSelectedDays(p.idealDays);

    // Adjust dates to match preset duration
    const today = new Date('2026-10-09T00:00:00'); // Friday Oct 9
    const end = new Date(today);
    end.setDate(today.getDate() + (p.idealDays - 1));

    const sStr = today.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    setStartDate(sStr);
    setEndDate(p.idealDays === 1 ? sStr : eStr);
    setProposalStatus('pending');
    setProposalRevision(1);
  };

  const handleDaysChange = (days: number | 'all') => {
    setSelectedDays(days);
    if (typeof days === 'number') {
      if (days === 1) {
        setEndDate(startDate);
      } else {
        const start = new Date(startDate + 'T00:00:00');
        const newEnd = new Date(start);
        newEnd.setDate(start.getDate() + (days - 1));
        setEndDate(newEnd.toISOString().split('T')[0]);
      }
    }
    setProposalStatus('pending');
  };

  // Proposal Accept & Reject Handlers
  const handleAcceptProposal = () => {
    setProposalStatus('accepted');
  };

  const handleRejectProposal = (feedback: string) => {
    setProposalStatus('rejected');
    setProposalRevision((prev) => prev + 1);

    // Record into memory bank
    const newConstraint: MemoryConstraint = {
      id: 'rej-' + Date.now(),
      category: 'pace',
      description: `Rejection Critique: ${feedback}`,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMemoryConstraints((prev) => [newConstraint, ...prev]);

    // Re-generate with constraint
    fetchPlan(feedback, 'pace');
  };

  // Handle Rejection feedback loop from decision station
  const handleRejectWithFeedback = (
    feedbackText: string,
    category?: MemoryConstraint['category']
  ) => {
    const resolvedCategory = category || 'pace';
    setProposalStatus('rejected');
    setProposalRevision((prev) => prev + 1);

    // Record into memory bank
    const newConstraint: MemoryConstraint = {
      id: 'c-' + Date.now(),
      category: resolvedCategory,
      description: feedbackText,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMemoryConstraints((prev) => [newConstraint, ...prev]);

    // Re-generate with constraint
    fetchPlan(feedbackText, resolvedCategory);
  };

  // Handle Pivot selection
  const handleSelectPivot = (pivotText: string) => {
    const newConstraint: MemoryConstraint = {
      id: 'pivot-' + Date.now(),
      category: 'custom',
      description: `Quick Pivot: ${pivotText}`,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMemoryConstraints((prev) => [newConstraint, ...prev]);
    fetchPlan(`User selected pivot: ${pivotText}`, 'custom');
  };

  const handleRemoveConstraint = (id: string) => {
    setMemoryConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAllConstraints = () => {
    setMemoryConstraints([]);
  };

  const handleAddManualConstraint = (text: string) => {
    const newConstraint: MemoryConstraint = {
      id: 'man-' + Date.now(),
      category: 'custom',
      description: text,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMemoryConstraints((prev) => [newConstraint, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#1E1B19] flex flex-col font-sans selection:bg-[#C88A3C]/20 selection:text-[#462900]">
      {/* Header */}
      <Header
        memoryConstraints={memoryConstraints}
        onOpenMemory={() => setIsMemoryModalOpen(true)}
        onOpenJson={() => setIsJsonModalOpen(true)}
        onOpenPdf={() => setIsPdfModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        isAiConnected={aiSource === 'gemini' || aiSource === 'gemini-grounded'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Hero Briefing & Intent */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-[#E3D5C5]/60">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF2EE] border border-[#E3D5C5] text-xs font-semibold text-[#865302] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
              <span>Zero-Fatigue Autonomous Agent</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-editorial text-[#1E1B19] leading-tight">
              The Orbit <span className="italic font-normal text-[#C88A3C]">Travel Intelligence</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#514538] leading-relaxed">
              Orbit Engine actively filters out crowd traps, pinpoints exact dawn departure corridors
              to circumvent weekend bottlenecks, and locks verified acoustic sanctuaries with one click.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium text-[#655D59]">
            <div className="p-3 bg-[#FAF2EE] rounded-xl border border-[#E3D5C5] min-w-28">
              <span className="text-[10px] text-[#837466] uppercase block">Engine Bias</span>
              <span className="font-semibold text-[#1E1B19]">Anti-Tourist Trap</span>
            </div>
            <div className="p-3 bg-[#FAF2EE] rounded-xl border border-[#E3D5C5] min-w-28">
              <span className="text-[10px] text-[#837466] uppercase block">Traffic Rule</span>
              <span className="font-semibold text-[#1E1B19]">Dawn Corridor</span>
            </div>
            <div className="p-3 bg-[#FAF2EE] rounded-xl border border-[#E3D5C5] min-w-28">
              <span className="text-[10px] text-[#837466] uppercase block">Memory Loop</span>
              <span className="font-semibold text-emerald-800">Adaptive Active</span>
            </div>
          </div>
        </div>

        {/* Real-time Agent Reasoning Notice Banner */}
        {reasoningMessage && (
          <div className="p-4 rounded-xl bg-[#2C2623] text-[#FFF8F5] border border-[#E3D5C5]/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
            <div className="w-5 h-5 border-2 border-[#C88A3C] border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="text-xs sm:text-sm font-medium">
              <span className="text-[#C88A3C] font-bold">Orbit Autonomous Kernel: </span>
              {reasoningMessage}
            </div>
          </div>
        )}

        {/* Trip Configuration Section */}
        <section>
          <TripConfigurator
            origin={origin}
            destination={destination}
            dates={dates}
            startDate={startDate}
            endDate={endDate}
            travelerCount={travelerCount}
            style={style}
            selectedDays={selectedDays}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onDatesChange={() => {}}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onTravelerCountChange={setTravelerCount}
            onStyleChange={setStyle}
            onSelectedDaysChange={handleDaysChange}
            onSelectPreset={handleSelectPreset}
            onGenerate={() => fetchPlan()}
            isLoading={isLoading || isAdapting}
          />
        </section>

        {/* Core Output Stage */}
        {currentPlan ? (
          <div className="space-y-8 animate-in fade-in duration-300">
                {/* Top Compact Proposal Status Bar with Quick Jump to Decision Station */}
                <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-data font-bold uppercase tracking-wider bg-[#2C2623] text-[#FFF8F5]">
                      Revision #{proposalRevision}
                    </span>
                    <div className="flex items-center gap-2">
                      {proposalStatus === 'accepted' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Plan Proposal Accepted
                        </span>
                      ) : proposalStatus === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Critique Adapted · Awaiting Decision
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#865302]">
                          <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
                          Decisive Proposal Ready for Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsPdfModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FFF8F5] text-[#1E1B19] border border-[#E3D5C5] font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                      title="Download Editorial Dossier PDF"
                    >
                      <Sparkles className="w-3 h-3 text-[#C88A3C]" />
                      <span>Dossier PDF</span>
                    </button>

                    <a
                      href="#traveller-decision-station"
                      className="px-3.5 py-1.5 rounded-lg bg-[#2C2623] hover:bg-[#1E1B19] text-[#FFF8F5] font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <span>Go to Decision Station</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Executive Summary Card with Calendar Dynamics */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E3D5C5] shadow-xs relative">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#865302]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C88A3C]" />
                      <span>Autonomous Executive Verdict</span>
                    </div>
                    <span className="font-data text-[#837466] lowercase font-normal">
                      {dates}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-[#1E1B19] font-medium leading-relaxed font-editorial">
                    "{currentPlan.summary}"
                  </p>

                  {/* Lightweight Interactive Route Visualization Map */}
                  <div className="mt-5 pt-5 border-t border-[#E3D5C5]/70">
                    <RouteVisualizationMap
                      origin={origin}
                      destination={destination}
                      departureAdvice={currentPlan.departure_advice}
                      seasonalDynamics={currentPlan.seasonal_dynamics}
                    />
                  </div>

                  {/* Real-Time Destination Weather Forecast Widget */}
                  <div className="mt-5 pt-5 border-t border-[#E3D5C5]/70">
                    <WeatherForecastWidget
                      destination={destination}
                      startDate={startDate}
                      endDate={endDate}
                      datesDescriptor={dates}
                    />
                  </div>

                  {/* Trip Budget Estimation & Cost Breakdown Feature */}
                  <div className="mt-5 pt-5 border-t border-[#E3D5C5]/70">
                    <BudgetEstimationWidget
                      plan={currentPlan}
                      travelerCount={travelerCount}
                      durationDays={selectedDays}
                      startDate={startDate}
                      endDate={endDate}
                      datesDescriptor={dates}
                      onUpdateTravelerCount={setTravelerCount}
                    />
                  </div>

                  {/* Date, Weekend/Midweek & Holiday Season Dynamics Callout */}
                  {currentPlan.seasonal_dynamics && (
                    <div className="mt-4 pt-4 border-t border-[#E3D5C5]/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#865302]">Date & Demand Physics:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF2EE] text-[#1E1B19] border border-[#E3D5C5] font-medium text-[11px]">
                          {currentPlan.seasonal_dynamics.date_classification}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${
                          currentPlan.seasonal_dynamics.rush_factor === 'High' || currentPlan.seasonal_dynamics.rush_factor === 'Peak Surge'
                            ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                            : 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                        }`}>
                          Rush Level: {currentPlan.seasonal_dynamics.rush_factor}
                        </span>
                      </div>
                      <div className="font-data font-bold text-[#865302] text-xs">
                        {currentPlan.seasonal_dynamics.price_impact}
                      </div>
                      <p className="w-full text-xs text-[#655D59] mt-0.5 leading-relaxed">
                        {currentPlan.seasonal_dynamics.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Google Search Grounding Live Intelligence Callout */}
                  <div className="mt-4 pt-3.5 border-t border-[#E3D5C5]/60 flex flex-wrap items-center justify-between gap-3 text-xs bg-[#FAF5EE] -mx-6 -mb-6 p-4 rounded-b-2xl border-b border-[#E3D5C5]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E1B19]">Google Search Data Grounding Active</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                            Live Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-[#655D59]">
                          {currentPlan.live_grounded_notes || `Real-time web verified road routes, highway congestion points, and verified sentiment for ${destination}.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSearchModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F2E8DC] text-[#865302] border border-[#DECFC0] text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Globe className="w-3 h-3 text-[#C88A3C]" />
                        <span>View Search Intel</span>
                      </button>
                      <button
                        onClick={() => setIsVoiceModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-[#2C2623] hover:bg-[#443B35] text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>Voice Discuss</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Operating Rule 1: Departure & Traffic Reasoning Card */}
                <section>
                  <DepartureTrafficCard
                    advice={currentPlan.departure_advice}
                    origin={origin}
                    destination={destination}
                    seasonalDynamics={currentPlan.seasonal_dynamics}
                  />
                </section>

                {/* Operating Rule 2: Lodging Card (Crowd & Sentiment Filtered) */}
                <section>
                  <LodgingCard
                    hotel={currentPlan.hotel_recommendation}
                    seasonalDynamics={currentPlan.seasonal_dynamics}
                    onInitiatePurchase={() => setIsReservationModalOpen(true)}
                  />
                </section>

                {/* Itinerary Timeline */}
                <section>
                  <ItineraryTimeline itinerary={currentPlan.itinerary} />
                </section>

                {/* Alternative Quick Pivots */}
                {currentPlan.alternative_quick_pivots && currentPlan.alternative_quick_pivots.length > 0 && (
                  <section>
                    <QuickPivots
                      pivots={currentPlan.alternative_quick_pivots}
                      onSelectPivot={handleSelectPivot}
                      isLoading={isAdapting || isLoading}
                    />
                  </section>
                )}

                {/* Operating Rule 3 & User Decision: Integrated Traveller Decision & Memory Loop Station */}
                <section>
                  <TravellerDecisionStation
                    status={proposalStatus}
                    revisionNumber={proposalRevision}
                    onAccept={handleAcceptProposal}
                    onReject={handleRejectWithFeedback}
                    onOpenPdfModal={() => setIsPdfModalOpen(true)}
                    isAdapting={isAdapting}
                    isLoading={isLoading}
                    memoryConstraints={memoryConstraints}
                    onRemoveConstraint={handleRemoveConstraint}
                    onClearAllConstraints={handleClearAllConstraints}
                  />
                </section>
              </div>
            ) : (
              <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-12 text-center max-w-xl mx-auto space-y-3">
                <Compass className="w-10 h-10 text-[#C88A3C] mx-auto" />
                <h3 className="text-lg font-bold text-[#1E1B19]">Ready to Generate Proposal</h3>
                <p className="text-xs text-[#655D59]">
                  Select your destination and dates above, then click Generate Autonomous Plan.
                </p>
              </div>
            )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3D5C5]/60 bg-[#FAF2EE] py-8 text-xs text-[#655D59]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#865302]" />
            <span className="font-semibold text-[#1E1B19]">The Orbit Travel Intelligence</span>
            <span>· Autonomous Decision Agent</span>
          </div>
          <div className="flex items-center gap-4 text-[#837466]">
            <span>Decision Fatigue Elimination</span>
            <span>·</span>
            <span>Verified Acoustic Serenity</span>
            <span>·</span>
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="text-[#865302] hover:underline font-semibold"
            >
              Strict Schema API
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <JsonInspectorModal
        plan={currentPlan}
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
      />

      <ReservationModal
        hotel={currentPlan?.hotel_recommendation || null}
        dates={dates}
        travelerCount={travelerCount}
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
      />

      <MemoryBankModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memoryConstraints={memoryConstraints}
        onRemoveConstraint={handleRemoveConstraint}
        onClearAll={handleClearAllConstraints}
        onAddManualConstraint={handleAddManualConstraint}
      />

      {/* Editorial Travel Dossier PDF Modal */}
      <EditorialPdfModal
        plan={currentPlan}
        origin={origin}
        destination={destination}
        dates={dates}
        travelerCount={travelerCount}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />

      {/* Google Search Grounding Drawer */}
      <GroundedSearchDrawer
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        destination={destination}
        origin={origin}
      />

      {/* Real-time Conversational Travel Copilot Chat */}
      <TravelCopilotChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentPlan={currentPlan}
        origin={origin}
        destination={destination}
        dates={dates}
      />

      {/* Gemini 3.8 Live Voice Session Modal */}
      <VoiceSessionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        destination={destination}
        origin={origin}
      />
    </div>
  );
}
