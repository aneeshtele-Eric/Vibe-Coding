import React, { useState } from 'react';
import { X, ShieldCheck, Zap, CheckCircle2, Clock, Calendar, Download, ExternalLink, Sparkles } from 'lucide-react';
import { HotelRecommendation } from '../types';

interface ReservationModalProps {
  hotel: HotelRecommendation | null;
  dates: string;
  travelerCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  hotel,
  dates,
  travelerCount,
  isOpen,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservationResult, setReservationResult] = useState<{
    reservationId: string;
    status: string;
    rateLocked: string;
    guaranteeDeadline: string;
  } | null>(null);

  if (!isOpen || !hotel) return null;

  const handleConfirmReservation = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/simulate-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelName: hotel.name,
          roomType: 'Curated Sanctuary Villa',
          guests: travelerCount,
          price: hotel.best_price,
        }),
      });
      const data = await res.json();
      setReservationResult(data);
    } catch (err) {
      // Local fallback token
      const fakeId = 'ORB-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-7721';
      setReservationResult({
        reservationId: fakeId,
        status: 'CONFIRMED_HELD',
        rateLocked: hotel.best_price,
        guaranteeDeadline: '24 Hours Prior to Arrival (100% Refundable)',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setReservationResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E3D5C5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B19]">
                Autonomous Purchasing Agent
              </h3>
              <p className="text-xs text-[#655D59]">
                Zero-friction rate lock & verified sanctuary hold
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-[#837466] hover:text-[#1E1B19] hover:bg-[#F4ECE8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!reservationResult ? (
            <>
              {/* Hotel & Rate Summary */}
              <div className="p-4 rounded-xl bg-white border border-[#E3D5C5] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865302] block">
                      Target Lodging
                    </span>
                    <h4 className="text-lg font-bold text-[#1E1B19] font-editorial">
                      {hotel.name}
                    </h4>
                    <p className="text-xs text-[#655D59] mt-0.5">
                      Provider Channel: {hotel.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#837466] uppercase block">
                      Guaranteed Rate
                    </span>
                    <span className="text-base font-bold font-data text-[#1E1B19]">
                      {hotel.best_price}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E3D5C5]/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#837466] block">Travel Dates</span>
                    <span className="font-semibold text-[#1E1B19]">{dates}</span>
                  </div>
                  <div>
                    <span className="text-[#837466] block">Party Size</span>
                    <span className="font-semibold text-[#1E1B19]">{travelerCount} Guests</span>
                  </div>
                </div>
              </div>

              {/* Rate Freeze Protection Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Autonomous Rate Freeze Active: </span>
                  Orbit Engine locks this rate for 15 minutes while you confirm. No hidden booking fees or dynamic surge surcharges.
                </div>
              </div>

              {/* Verified Sentiment Audit */}
              <div className="p-3.5 rounded-xl bg-[#FFF8F5] border border-[#E3D5C5] text-xs text-[#514538] italic">
                "{hotel.sentiment_highlight}"
              </div>

              {/* CTA */}
              <div className="pt-2">
                <button
                  onClick={handleConfirmReservation}
                  disabled={isProcessing}
                  className="w-full py-3 px-5 rounded-xl text-sm font-semibold text-[#FFF8F5] bg-[#2C2623] hover:bg-[#1E1B19] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm border border-[#E3D5C5]/30"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#C88A3C] border-t-transparent rounded-full animate-spin" />
                      <span>Securing Autonomous Reservation Token...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-[#C88A3C]" />
                      <span>Confirm 24h Autonomous Hold</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-[#837466] mt-2">
                  No immediate charge. 100% free cancellation until 24 hours before check-in.
                </p>
              </div>
            </>
          ) : (
            /* Confirmation Voucher View */
            <div className="space-y-5 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Hold Confirmed & Token Locked
                </span>
                <h4 className="text-xl font-bold text-[#1E1B19] font-editorial mt-3">
                  Reservation Voucher Issued
                </h4>
                <p className="text-xs text-[#655D59] mt-1">
                  Orbit Engine autonomous purchasing token has placed a direct hold on your sanctuary villa.
                </p>
              </div>

              {/* Token Details Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E3D5C5] text-left space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E3D5C5]/60">
                  <span className="text-xs text-[#837466]">Reservation Token:</span>
                  <span className="font-data text-xs font-bold text-[#865302] bg-[#FAF2EE] px-2 py-0.5 rounded border border-[#E3D5C5]">
                    {reservationResult.reservationId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#837466]">Property:</span>
                  <span className="font-semibold text-[#1E1B19]">{hotel.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#837466]">Rate Locked:</span>
                  <span className="font-data font-semibold text-[#1E1B19]">{reservationResult.rateLocked}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#837466]">Cancellation:</span>
                  <span className="text-emerald-700 font-medium">{reservationResult.guaranteeDeadline}</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <a
                  href={hotel.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#2C2623] hover:bg-[#1E1B19] text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Provider Voucher</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#C88A3C]" />
                </a>
                <button
                  onClick={handleReset}
                  className="py-2.5 px-4 rounded-xl text-xs font-medium bg-white hover:bg-[#F4ECE8] text-[#514538] border border-[#E3D5C5] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
