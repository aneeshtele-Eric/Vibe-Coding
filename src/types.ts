export interface DepartureAdvice {
  recommended_time: string;
  route: string;
  traffic_notes: string;
  total_distance_km: number;
}

export interface HotelRecommendation {
  name: string;
  rating: string;
  best_price: string;
  provider: string;
  booking_url: string;
  sentiment_highlight: string;
}

export interface ItineraryItem {
  day: number;
  time: string;
  activity: string;
  crowd_level: 'Low' | 'Moderate' | 'High';
  notes: string;
}

export interface SeasonalDynamics {
  date_classification: string; // e.g. "Weekend Leisure Rush", "Midweek Off-Peak", "Holiday Peak Surge"
  rush_factor: 'Low' | 'Moderate' | 'High' | 'Peak Surge';
  price_impact: string; // e.g. "+25% Weekend Peak Demand" or "-30% Off-Peak Serenity Savings"
  reasoning: string;
}

export interface OrbitPlan {
  summary: string;
  departure_advice: DepartureAdvice;
  hotel_recommendation: HotelRecommendation;
  itinerary: ItineraryItem[];
  alternative_quick_pivots: string[];
  seasonal_dynamics?: SeasonalDynamics;
  grounding_sources?: Array<{
    title: string;
    url: string;
  }>;
  search_queries?: string[];
  live_grounded_notes?: string;
}

export interface MemoryConstraint {
  id: string;
  category: 'pace' | 'lodging' | 'timing' | 'budget' | 'custom';
  description: string;
  addedAt: string;
}

export interface PresetDestination {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  label: string;
  tagline: string;
  geographyNote: string;
  style: string;
  defaultDates: string;
  minDays: number;
  maxDays: number;
  idealDays: number;
  distanceKm?: number;
}


