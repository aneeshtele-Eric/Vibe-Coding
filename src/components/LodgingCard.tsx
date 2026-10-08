import React from 'react';
import { BedDouble, Star, ExternalLink, ShieldCheck, Zap, Lock, VolumeX, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { HotelRecommendation, SeasonalDynamics } from '../types';

interface LodgingCardProps {
  hotel: HotelRecommendation;
  seasonalDynamics?: SeasonalDynamics;
  onInitiatePurchase: () => void;
}

export const LodgingCard: React.FC<LodgingCardProps> = ({
  hotel,
  seasonalDynamics,
  onInitiatePurchase,
}) => {
  return (
    <div className="bg-[#FAF2EE] rounded-2xl border border-[#E3D5C5] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(44,38,35,0.06)] relative overflow-hidden">
      {/* Kicker */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2C2623] text-[#C88A3C] flex items-center justify-center">
            <BedDouble className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#865302]">
              Rule 2 · Verified Sentiment & Crowd Filtering
            </span>
            <h3 className="text-base font-bold text-[#1E1B19]">
              Curated Sanctuary Lodging
            </h3>
          </div>
        </div>

        {/* Live Provider */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E3D5C5] text-xs font-medium text-[#514538]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Provider: {hotel.provider}</span>
        </div>
      </div>

      {/* Main Sanctuary Card */}
      <div className="bg-white rounded-xl border border-[#E3D5C5] p-5 sm:p-6 shadow-2xs mb-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF8F5] border border-[#E3D5C5] text-[11px] font-data font-semibold text-[#865302]">
                <Star className="w-3 h-3 fill-[#C88A3C] text-[#C88A3C]" />
                {hotel.rating}
              </span>
              <span className="text-xs text-[#837466] font-medium">
                Verified Crowd Insulation Index: 98/100
              </span>
            </div>

            <h4 className="text-xl sm:text-2xl font-bold text-[#1E1B19] font-editorial tracking-tight mb-2">
              {hotel.name}
            </h4>

            {/* Sentiment Highlight Callout Box */}
            <div className="mt-3 p-4 rounded-xl bg-[#FFF8F5] border border-[#E3D5C5]/80 relative">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#865302] mb-1">
                <VolumeX className="w-3.5 h-3.5 text-[#C88A3C]" />
                <span>Verified Guest Sentiment & Acoustic Audit:</span>
              </div>
              <p className="text-xs sm:text-sm text-[#514538] italic leading-relaxed">
                "{hotel.sentiment_highlight}"
              </p>
            </div>
          </div>

          {/* Pricing & Autonomous Purchasing Actions */}
          <div className="md:w-64 flex flex-col justify-between bg-[#FAF2EE] p-4 rounded-xl border border-[#E3D5C5]">
            <div>
              {seasonalDynamics && (
                <div className={`mb-2 px-2.5 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                  seasonalDynamics.price_impact.includes('Savings')
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}>
                  {seasonalDynamics.price_impact.includes('Savings') ? (
                    <TrendingDown className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-amber-600" />
                  )}
                  <span>{seasonalDynamics.price_impact}</span>
                </div>
              )}

              <span className="text-[11px] text-[#655D59] font-medium uppercase tracking-wider block">
                Guaranteed Best Rate
              </span>
              <div className="text-2xl font-bold font-data text-[#1E1B19] mt-0.5">
                {hotel.best_price}
              </div>
              <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Price Match & Rate Freeze
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {/* Primary Agent Purchasing CTA */}
              <button
                onClick={onInitiatePurchase}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#FFF8F5] bg-[#2C2623] hover:bg-[#1E1B19] active:scale-[0.98] shadow-xs flex items-center justify-center gap-2 transition-all border border-[#E3D5C5]/30"
              >
                <Zap className="w-3.5 h-3.5 text-[#C88A3C]" />
                <span>Autonomous Reservation Hold</span>
              </button>

              {/* Direct Booking Link */}
              <a
                href={hotel.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#514538] bg-white hover:bg-[#F4ECE8] border border-[#E3D5C5] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Direct Provider Link</span>
                <ExternalLink className="w-3 h-3 text-[#837466]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
