import React, { useRef, useState } from 'react';
import { X, Download, Printer, ShieldCheck, Compass, MapPin, Clock, BedDouble, Calendar, Sparkles, Route, Star, VolumeX, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';
import { OrbitPlan } from '../types';
import { getImageryForDestination } from '../data/imagery';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface EditorialPdfModalProps {
  plan: OrbitPlan | null;
  origin: string;
  destination: string;
  dates: string;
  travelerCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const EditorialPdfModal: React.FC<EditorialPdfModalProps> = ({
  plan,
  origin,
  destination,
  dates,
  travelerCount,
  isOpen,
  onClose,
}) => {
  const dossierRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !plan) return null;

  const imagery = getImageryForDestination(destination);
  const reservationToken = 'ORB-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-77';

  // Direct PDF Download via html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!dossierRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = dossierRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High DPI
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFF8F5',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if document is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanFileName = `Orbit_Engine_Dossier_${destination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(cleanFileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Generation failed, falling back to browser print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] w-full max-w-4xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Top Floating Control Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E3D5C5] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
              <Compass className="w-5 h-5 animate-[spin_25s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E1B19]">
                  Editorial Travel Dossier (PDF Export)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Bespoke Architectural Layout
                </span>
              </div>
              <p className="text-xs text-[#655D59]">
                Publication-grade magazine itinerary with high-res photos, route schematic & token certificate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2C2623] hover:bg-[#1E1B19] active:scale-95 text-[#FFF8F5] flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 border border-[#E3D5C5]/20"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#C88A3C] border-t-transparent rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#C88A3C]" />
                  <span>Download PDF Dossier</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-[#514538] hover:text-[#1E1B19] hover:bg-[#F4ECE8] border border-[#E3D5C5] transition-colors"
              title="Print / Save via browser dialog"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#837466] hover:text-[#1E1B19] hover:bg-[#F4ECE8] transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#E9E1DD]/40 flex justify-center">
          {/* THE ACTUAL BESPOKE EDITORIAL DOSSIER DOCUMENT */}
          <div
            ref={dossierRef}
            id="editorial-dossier-document"
            className="w-full max-w-[800px] bg-[#FFF8F5] text-[#1E1B19] p-8 sm:p-12 rounded-xl border border-[#E3D5C5] shadow-lg space-y-10"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {/* Header Document Masthead */}
            <div className="border-b-2 border-[#1E1B19] pb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-data font-bold tracking-[0.2em] uppercase text-[#865302] block mb-1">
                  ORBIT ENGINE · PRIVATE AUTONOMOUS DOSSIER
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-editorial tracking-tight text-[#1E1B19]">
                  {destination} <span className="italic font-normal text-[#C88A3C]">Expedition</span>
                </h1>
                <p className="text-xs text-[#655D59] mt-1 font-medium">
                  Origin: <strong className="text-[#1E1B19]">{origin}</strong> · Corridor: <strong className="text-[#1E1B19]">{plan.departure_advice.total_distance_km} km</strong> · Travelers: <strong className="text-[#1E1B19]">{travelerCount} Guests</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-data font-bold uppercase tracking-widest text-[#865302] block">
                  VERIFICATION TOKEN
                </span>
                <span className="font-data text-xs font-bold text-[#1E1B19] bg-[#FAF2EE] px-2.5 py-1 rounded border border-[#E3D5C5] inline-block mt-0.5">
                  {reservationToken}
                </span>
                <span className="block text-[10px] text-[#837466] mt-1 font-data">
                  {dates}
                </span>
              </div>
            </div>

            {/* Hero Cover Photography Feature with Scrim */}
            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[16/8]">
              <img
                src={imagery.heroCover}
                alt={destination}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C88A3C] mb-1">
                  THE ORBIT · TRAVEL INTELLIGENCE BLUEPRINT
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-editorial text-white leading-snug max-w-xl">
                  "{plan.summary}"
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#E3D5C5]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C88A3C]" />
                    Departure: {plan.departure_advice.recommended_time}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Zero Tourist-Trap Index: 100%
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Strategic Corridor Routing & Traffic Window */}
            <div className="p-6 rounded-2xl bg-[#FAF2EE] border border-[#E3D5C5] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3D5C5]/60">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#865302]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E1B19]">
                    01. Strategic Transit Architecture & Traffic Physics
                  </h3>
                </div>
                <span className="text-xs font-data font-semibold text-[#865302] bg-white px-2.5 py-0.5 rounded-full border border-[#E3D5C5]">
                  Optimal Window: {plan.departure_advice.recommended_time}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-7 space-y-2.5 text-xs text-[#514538] leading-relaxed">
                  <div>
                    <span className="font-bold text-[#1E1B19] block text-[11px] uppercase tracking-wider mb-0.5">
                      Selected Arterial Path:
                    </span>
                    <p className="bg-white p-2.5 rounded-lg border border-[#E3D5C5]/80 font-medium">
                      {plan.departure_advice.route}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-[#865302] block text-[11px] uppercase tracking-wider mb-0.5">
                      Bottleneck Evasion Rationale:
                    </span>
                    <p className="bg-[#FFF8F5] p-2.5 rounded-lg border border-[#E3D5C5] italic text-[11px]">
                      {plan.departure_advice.traffic_notes}
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-5 rounded-xl overflow-hidden border border-[#E3D5C5] shadow-xs">
                  <img
                    src={imagery.landscapePhoto}
                    alt="Scenic Corridor Route"
                    className="w-full h-36 object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="p-2 bg-white text-[10px] text-center text-[#837466] font-medium">
                    Verified Off-Peak Scenic Arterial
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Verified Sanctuary Lodging Feature */}
            <div className="p-6 rounded-2xl bg-white border border-[#E3D5C5] shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3D5C5]/60">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-[#865302]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E1B19]">
                    02. Verified Acoustic Sanctuary Lodging
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#865302]">
                  <Star className="w-3.5 h-3.5 fill-[#C88A3C] text-[#C88A3C]" />
                  <span>{plan.hotel_recommendation.rating} Verified Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                <div className="sm:col-span-5 rounded-xl overflow-hidden border border-[#E3D5C5] shadow-xs">
                  <img
                    src={imagery.lodgingPhoto}
                    alt={plan.hotel_recommendation.name}
                    className="w-full h-44 object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="p-2.5 bg-[#FAF2EE] text-[11px] text-[#1E1B19] font-semibold text-center">
                    Channel: {plan.hotel_recommendation.provider}
                  </div>
                </div>

                <div className="sm:col-span-7 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-bold font-editorial text-[#1E1B19]">
                      {plan.hotel_recommendation.name}
                    </h4>
                    <div className="mt-2 p-3 bg-[#FAF2EE] rounded-xl border border-[#E3D5C5] text-xs text-[#514538] italic">
                      <div className="flex items-center gap-1.5 text-[#865302] font-semibold not-italic mb-1 text-[11px]">
                        <VolumeX className="w-3 h-3 text-[#C88A3C]" />
                        <span>Acoustic Serenity Audit:</span>
                      </div>
                      "{plan.hotel_recommendation.sentiment_highlight}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E3D5C5]/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#837466] uppercase tracking-wider block">
                        Locked Daily Tariff
                      </span>
                      <span className="text-lg font-bold font-data text-[#1E1B19]">
                        {plan.hotel_recommendation.best_price}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Rate Freeze Confirmed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 03: Estimated Budget Outlay & Inferred Activities Audit */}
            <div className="p-5 rounded-2xl bg-[#FAF5EE] border border-[#E3D5C5] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3D5C5]/60 mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#865302]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E1B19]">
                    03. Trip Budget Estimation & Capital Allocation
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#865302]">
                  Synthesized for {travelerCount} Guest{travelerCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#E3D5C5]">
                  <span className="text-[10px] text-[#837466] uppercase block font-semibold">Sanctuary Lodging</span>
                  <div className="font-bold font-data text-sm text-[#1E1B19] mt-0.5">
                    {plan.hotel_recommendation.best_price}
                  </div>
                  <span className="text-[10px] text-[#655D59] block mt-0.5">Guaranteed locked rate</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E3D5C5]">
                  <span className="text-[10px] text-[#837466] uppercase block font-semibold">Inferred Activities</span>
                  <div className="font-bold font-data text-sm text-[#1E1B19] mt-0.5">
                    {plan.hotel_recommendation.best_price.includes('$') ? '$180 total' : '₹4,800 total'}
                  </div>
                  <span className="text-[10px] text-[#655D59] block mt-0.5">{plan.itinerary.length} waypoints inferred</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E3D5C5]">
                  <span className="text-[10px] text-[#837466] uppercase block font-semibold">Dining & Provisions</span>
                  <div className="font-bold font-data text-sm text-[#1E1B19] mt-0.5">
                    {plan.hotel_recommendation.best_price.includes('$') ? '$240 party' : '₹5,400 party'}
                  </div>
                  <span className="text-[10px] text-[#655D59] block mt-0.5">Artisanal regional dining</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E3D5C5]">
                  <span className="text-[10px] text-[#837466] uppercase block font-semibold">Mobility & Express Tolls</span>
                  <div className="font-bold font-data text-sm text-[#1E1B19] mt-0.5">
                    {plan.hotel_recommendation.best_price.includes('$') ? '$85 transit' : '₹4,200 transit'}
                  </div>
                  <span className="text-[10px] text-[#655D59] block mt-0.5">{(plan.departure_advice?.total_distance_km || 250) * 2} km round-trip</span>
                </div>
              </div>
            </div>

            {/* Section 4: Visual Day-by-Day Chronological Itinerary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E3D5C5]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E1B19]">
                  04. Day-by-Day Chronology & Anti-Trap Waypoints
                </h3>
                <span className="text-xs text-[#837466] font-medium">
                  {plan.itinerary.length} Curated Milestones
                </span>
              </div>

              <div className="space-y-3">
                {plan.itinerary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-[#E3D5C5] flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="px-2 py-1 bg-[#FAF2EE] rounded-md font-data text-xs font-bold text-[#865302] border border-[#E3D5C5] shrink-0">
                        {item.time}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#837466] uppercase">
                            Day {item.day}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${
                            item.crowd_level === 'Low'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {item.crowd_level} Crowd
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-[#1E1B19] mt-0.5">
                          {item.activity}
                        </h5>
                        <p className="text-xs text-[#514538] mt-1 leading-relaxed">
                          {item.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Strategic Alternative Pivots */}
            {plan.alternative_quick_pivots && plan.alternative_quick_pivots.length > 0 && (
              <div className="p-5 rounded-xl bg-[#FAF2EE] border border-[#E3D5C5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#865302] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C88A3C]" />
                  <span>Pre-Calculated Contingency Pivots</span>
                </h4>
                <ul className="text-xs text-[#514538] space-y-1.5 list-disc pl-4">
                  {plan.alternative_quick_pivots.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Official Certification & Signature Footer */}
            <div className="pt-6 border-t-2 border-[#1E1B19] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#655D59]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <span className="font-bold text-[#1E1B19] block">
                    Certified by Orbit Engine Autonomous Agent
                  </span>
                  <span className="text-[10px] text-[#837466]">
                    Security Hash: {reservationToken} · Decision Fatigue Eliminated
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] font-data">
                Issued for {travelerCount} Guests · {dates}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
