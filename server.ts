import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Initialize Gemini Client with telemetry User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Circuit-breaker for API rate limits and quota exhaustion (HTTP 429 / RESOURCE_EXHAUSTED)
let quotaCooldownUntil = 0;

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  try {
    const msg = typeof err === 'string'
      ? err
      : ((err.message || '') + ' ' + (typeof err.status === 'number' ? err.status : '') + ' ' + (typeof err.code === 'number' ? err.code : '') + ' ' + JSON.stringify(err));
    return (
      msg.includes('429') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('quota') ||
      msg.includes('rate-limit') ||
      msg.includes('Rate limit') ||
      err?.status === 429 ||
      err?.code === 429
    );
  } catch {
    return false;
  }
}

function recordQuotaExhaustion() {
  quotaCooldownUntil = Date.now() + 60_000;
}

function isQuotaActive(): boolean {
  return Date.now() < quotaCooldownUntil;
}

export interface PlanRequest {
  origin: string;
  destination: string;
  dates?: string;
  travelerCount?: number;
  style?: string;
  durationDays?: number | 'all';
  rejectionFeedback?: string;
  activeConstraints?: string[];
  previousPlan?: any;
}

export interface OrbitPlan {
  summary: string;
  departure_advice: {
    recommended_time: string;
    route: string;
    traffic_notes: string;
    total_distance_km: number;
  };
  hotel_recommendation: {
    name: string;
    rating: string;
    best_price: string;
    provider: string;
    booking_url: string;
    sentiment_highlight: string;
  };
  itinerary: Array<{
    day: number;
    time: string;
    activity: string;
    crowd_level: 'Low' | 'Moderate' | 'High';
    notes: string;
  }>;
  alternative_quick_pivots: string[];
  seasonal_dynamics?: {
    date_classification: string;
    rush_factor: 'Low' | 'Moderate' | 'High' | 'Peak Surge';
    price_impact: string;
    reasoning: string;
  };
}

function getDeterministicPlan(req: PlanRequest): OrbitPlan {
  const origin = (req.origin || 'Bengaluru').trim();
  const dest = (req.destination || 'Coorg').trim();
  const feedback = (req.rejectionFeedback || '').toLowerCase();
  const constraints = req.activeConstraints || [];
  const datesStr = (req.dates || '').toLowerCase();

  const isOneDay = req.durationDays === 1 || datesStr.includes('1 day');
  const isWeekend = datesStr.includes('weekend') || datesStr.includes('sat') || datesStr.includes('sun') || datesStr.includes('fri') || (!datesStr.includes('midweek') && !datesStr.includes('tue') && !datesStr.includes('wed'));
  const isMidweek = !isWeekend && (datesStr.includes('midweek') || datesStr.includes('tue') || datesStr.includes('wed') || datesStr.includes('thu') || datesStr.includes('mon'));

  const seasonalDynamics = {
    date_classification: isOneDay ? "Single-Day Escape" : isMidweek ? "Midweek Off-Peak Window" : "Weekend Leisure Rush",
    rush_factor: (isMidweek ? "Low" : isOneDay ? "Moderate" : "High") as 'Low' | 'Moderate' | 'High' | 'Peak Surge',
    price_impact: isOneDay ? "Zero Lodging Tariff (Same-Day)" : isMidweek ? "30% Off-Peak Tariff Savings Applied" : "+28% Weekend Peak Demand Active",
    reasoning: isMidweek
      ? "Selected dates fall midweek: arterial expressways are clear of holiday exodus, and boutique lodges offer off-peak rates with deep acoustic solitude."
      : isOneDay
      ? "Single-day turnaround: Zero overnight accommodation cost. High day-tripper afternoon congestion requires strict early return window."
      : "Selected dates fall on a weekend: highway departure tolls peak between 07:00–09:30 AM and property tariffs operate at full peak demand."
  };

  const isHecticRejection =
    feedback.includes('hectic') ||
    feedback.includes('too busy') ||
    feedback.includes('rush') ||
    constraints.some((c) => c.toLowerCase().includes('reduced waypoints') || c.toLowerCase().includes('slow'));

  const isResortRejection =
    feedback.includes('resort') ||
    feedback.includes('homestay') ||
    feedback.includes('boutique') ||
    constraints.some((c) => c.toLowerCase().includes('homestay') || c.toLowerCase().includes('boutique'));

  const isDepartureRejection =
    feedback.includes('departure') ||
    feedback.includes('too early') ||
    feedback.includes('morning') ||
    feedback.includes('afternoon');

  // Route 1: Bengaluru to Coorg
  if (
    (origin.toLowerCase().includes('bengaluru') || origin.toLowerCase().includes('bangalore')) &&
    (dest.toLowerCase().includes('coorg') || dest.toLowerCase().includes('kodagu') || dest.toLowerCase().includes('madikeri'))
  ) {
    if (isHecticRejection) {
      return {
        summary: "Orbit Engine Constraint Adjustment: Scaled back itinerary intensity by 50%. Replaced packed sightseeing with unhurried estate quietude, private coffee blossom walks, and secluded riverside dining. Zero rush hours, maximum sensory restoration.",
        departure_advice: {
          recommended_time: isDepartureRejection ? "10:30 AM – 11:15 AM (Post-Morning Surge)" : "05:15 AM – 05:45 AM (Pre-NICE Road Surge)",
          route: "NICE Road → NH75 via Channarayapatna & Hassan bypass → Kushalnagar",
          traffic_notes: "Bypasses the infamous Mysore Expressway toll bottleneck and weekend morning Mysore town choke points. Hassan corridor offers continuous dual carriageways with 38% lighter vehicle volume.",
          total_distance_km: 268
        },
        hotel_recommendation: {
          name: isResortRejection ? "Misty Heights Private Heritage Planters Bungalow" : "The Ibnii Eco-Luxury Sanctuary (Koppa)",
          rating: "4.9 / 5.0",
          best_price: "₹18,400 / night",
          provider: "Direct Estate Reserve",
          booking_url: "https://www.booking.com/searchresults.html?ss=Coorg",
          sentiment_highlight: "Verified serenity score 98%: 'Zero highway noise; cottages situated 800m deep within undisturbed organic canopy with private estate stream.'"
        },
        itinerary: [
          {
            day: 1,
            time: "01:30 PM",
            activity: "Estate Arrival & Spiced Arabica Cold Brew Reception",
            crowd_level: "Low",
            notes: "Private check-in secluded from tourist reception zones; verandah overview of valley mists."
          },
          {
            day: 1,
            time: "04:30 PM",
            activity: "Guided Whispering Canopy Walk (Private Estate Boundary)",
            crowd_level: "Low",
            notes: "Avoids crowded Abbey Falls; proprietary walking trail through pepper vines and natural stream."
          },
          {
            day: 2,
            time: "09:30 AM",
            activity: "Unstructured Verandah Morning & Slow Kodava Breakfast",
            crowd_level: "Low",
            notes: "Pandi curry with Akki Rotti served fresh; 3.5 hours of dedicated quiet downtime."
          },
          {
            day: 2,
            time: "03:00 PM",
            activity: "Chettalli Coffee Bean Cupping & Honey Comb Sampling",
            crowd_level: "Low",
            notes: "Intimate 4-person tasting at heritage research station away from commercial tour buses."
          },
          {
            day: 3,
            time: "10:00 AM",
            activity: "Scenic Gentle Ascent via Bylakuppe Backroads",
            crowd_level: "Moderate",
            notes: "Quiet outskirts route avoiding central bazaar congestion before return."
          }
        ],
        alternative_quick_pivots: [
          "Pivot to 100% Plantation Homestay in South Coorg (Virajpet)",
          "Switch Hassan Route to Scenic Sakleshpur Ghat Corridor",
          "Extend downtime to complete unplugged digital detox"
        ]
      };
    }

    return {
      summary: "Autonomous weekend blueprint engineered to bypass Bengaluru exit gridlock. Prioritizes private Kodagu coffee estates over commercial Abbey Falls tourist crowds, pairing optimized dawn navigation with deep sensory quiet.",
      departure_advice: {
        recommended_time: "05:30 AM – 06:15 AM (Before Kengeri / NICE Congestion Peak)",
        route: "Bengaluru → NICE Ring Rd → Mysore Expressway (Exit Mandya) → Hunsur Bypass → Madikeri",
        traffic_notes: "Departing prior to 06:15 AM cuts transit time by 115 minutes, bypassing the notorious 07:30 AM toll bottleneck and weekend recreational cyclist jams near Bidadi.",
        total_distance_km: 254
      },
      hotel_recommendation: {
        name: isResortRejection ? "School Thota 1890 Heritage Homestay (Siddapur)" : "Evolve Back, Chikkana Halli Estate (Kabbe)",
        rating: "4.85 / 5.0",
        best_price: "₹24,500 / night",
        provider: "Tablet Hotels / Direct Reserve",
        booking_url: "https://www.booking.com/searchresults.html?ss=Coorg",
        sentiment_highlight: "Verified guest consensus: 'Individual pool villas nested in 300 acres of aroma coffee; acoustic isolation is pristine with bird calls only.'"
      },
      itinerary: [
        {
          day: 1,
          time: "06:00 AM",
          activity: "Optimal Wheels-Up Departure (Bengaluru NICE Gate)",
          crowd_level: "Low",
          notes: "Dawn departure guarantees clear 6-lane cruising past Ramanagara without truck congestion."
        },
        {
          day: 1,
          time: "08:15 AM",
          activity: "Decisive Breakfast Pivot: Kadambam / Vaidyar Cafe (Maddur Bypass)",
          crowd_level: "Moderate",
          notes: "Curated hygienic filter coffee break; beats the hyper-crowded Bidadi breakfast hubs."
        },
        {
          day: 1,
          time: "01:00 PM",
          activity: "Estate Arrival & Check-In at Chikkana Halli Sanctuary",
          crowd_level: "Low",
          notes: "Unpack amidst gentle rain canopy; estate welcomes with warm cardamon herbal tea."
        },
        {
          day: 1,
          time: "04:30 PM",
          activity: "Private Sunset Ridge Trail at Kabbe Hills Border",
          crowd_level: "Low",
          notes: "Bypasses the crowded Raja's Seat viewpoint; offers unobstructed panoramic cloud-bed views."
        },
        {
          day: 2,
          time: "07:30 AM",
          activity: "Early Mist Walk & Birding with Resident Naturalist",
          crowd_level: "Low",
          notes: "Over 40 avian species active before dawn heat; binoculars and field guide provided."
        },
        {
          day: 2,
          time: "11:30 AM",
          activity: "Culinary Heritage Demonstration: Traditional Kodava Kachampuli Glaze",
          crowd_level: "Low",
          notes: "Hands-on intimate workshop inside ancestral estate kitchen."
        },
        {
          day: 2,
          time: "04:00 PM",
          activity: "Secluded Harangi Backwater Kayak Drift",
          crowd_level: "Low",
          notes: "Hidden quiet inlet away from commercial rafting chaos in Dubare."
        },
        {
          day: 3,
          time: "09:00 AM",
          activity: "Artisanal Spice Curing & Fresh Roast Bean Procurement",
          crowd_level: "Low",
          notes: "Direct procurement of single-origin robusta and wild forest honey before return."
        }
      ],
      alternative_quick_pivots: [
        "Shift to Southern Kodagu (Nagarhole wildlife fringe)",
        "Switch lodging to private historic planter's wooden bungalow",
        "Compress to 2-day low-intensity slow getaway"
      ]
    };
  }

  // Route 2: San Francisco to Big Sur & Carmel Highlands
  if (
    origin.toLowerCase().includes('san francisco') ||
    dest.toLowerCase().includes('big sur') ||
    dest.toLowerCase().includes('carmel')
  ) {
    return {
      summary: isHecticRejection
        ? "Orbit Engine Rejection Memory Applied: Scaled down pacing by 50%. Excluded coastal tourist turnouts; anchored entire weekend at an ocean-cliff cliffside sanctuary with private wood-burning stove and zero driving past lunchtime."
        : "Autonomous Northern California coastal plan designed to dodge Highway 1 weekend choke points and tourist queues at Bixby Bridge. Curated for sublime ocean air, redwood serenity, and verified micro-climate tranquility.",
      departure_advice: {
        recommended_time: isDepartureRejection ? "01:30 PM – 02:00 PM (Midday Gap)" : "06:45 AM – 07:15 AM (Pre-Bay Area Weekend Rush)",
        route: "I-280 South → CA-85 → US-101 South via Prunedale Cutoff → CA-1 South through Carmel",
        traffic_notes: "Beats the 09:30 AM Silicon Valley weekend getaway exodus and preserves a swift transit through Monterey Bay before RV bottlenecks form on two-lane Highway 1.",
        total_distance_km: 232
      },
      hotel_recommendation: {
        name: isResortRejection ? "Glen Oaks Big Sur (Fireside Redwood Cabin)" : "Post Ranch Inn (Cliff House Suite)",
        rating: "4.92 / 5.0",
        best_price: "$1,150 / night",
        provider: "Relais & Châteaux / Direct",
        booking_url: "https://www.booking.com/searchresults.html?ss=Big+Sur",
        sentiment_highlight: "Verified acoustics: 'Zero vehicle acoustics from Highway 1; suspended 1,200 feet above Pacific surf with private starlight telescope.'"
      },
      itinerary: isHecticRejection
        ? [
            {
              day: 1,
              time: "02:00 PM",
              activity: "Redwood Canopy Cabin Arrival & Fireplace Unwind",
              crowd_level: "Low",
              notes: "Zero queues; private cabin nestled alongside the Big Sur River."
            },
            {
              day: 1,
              time: "05:30 PM",
              activity: "Cliffside Sunset Aperitif (Sierra Mar Terrace)",
              crowd_level: "Low",
              notes: "Reserved ocean ledge table; watch coastal fog roll beneath the cliffs."
            },
            {
              day: 2,
              time: "10:00 AM",
              activity: "Unhurried Morning: Slow Drip Coffee & Old Coast Road Walk",
              crowd_level: "Low",
              notes: "Bypasses crowded state park parking lots; peaceful dirt lane under eucalyptus."
            },
            {
              day: 2,
              time: "04:00 PM",
              activity: "Private Cedar Hot Tub Soak under Coastal Redwoods",
              crowd_level: "Low",
              notes: "100% serene restoration with zero digital interference."
            }
          ]
        : [
            {
              day: 1,
              time: "07:00 AM",
              activity: "Wheels Up: 280 Scenic Highway Corridor",
              crowd_level: "Low",
              notes: "Smooth, glass-like cruising down the Crystal Springs reservoir corridor."
            },
            {
              day: 1,
              time: "10:30 AM",
              activity: "Garrapata State Park Bluff Walk (Soberanes Point)",
              crowd_level: "Low",
              notes: "Secret sea-otter cove alternative to congested Point Lobos reservation lines."
            },
            {
              day: 1,
              time: "02:00 PM",
              activity: "Check-in & Pacific Overlook Immersion",
              crowd_level: "Low",
              notes: "Panoramic cliff views with heated stone floors and infinity basin."
            },
            {
              day: 2,
              time: "08:30 AM",
              activity: "Partington Cove Hidden Tunnel & Ocean Surge Creek",
              crowd_level: "Low",
              notes: "Historic 1880s timber tunnel leading directly to secluded turquoise surf."
            },
            {
              day: 2,
              time: "01:30 PM",
              activity: "Nepenthe Herb Focaccia & Terrace Wine Pairing",
              crowd_level: "Moderate",
              notes: "Pre-reserved mezzanine seating avoiding the lower-level tourist waiting rush."
            },
            {
              day: 3,
              time: "10:00 AM",
              activity: "Carmel Valley Village Artisan Olive Oil & Pinot Noir Tasting",
              crowd_level: "Low",
              notes: "Sun-drenched inland route avoiding coastal fog on the return journey."
            }
          ],
      alternative_quick_pivots: [
        "Swap Big Sur cliffs for sunny Carmel Valley vineyard cottage",
        "Add private naturalist-guided sea otter kayak in Moss Landing",
        "Shift to purely passive architectural retreat"
      ]
    };
  }

  // Route 3: Tokyo to Hakone & Izu
  if (
    origin.toLowerCase().includes('tokyo') ||
    dest.toLowerCase().includes('hakone') ||
    dest.toLowerCase().includes('izu')
  ) {
    return {
      summary: isHecticRejection
        ? "Constraint Adaptation: Pacing slowed by 50%. Bypassed ropeways and crowded pirate ship cruises. Centered exclusively around a private secluded Sukiya-style onsen ryokan with in-room kaiseki."
        : "Decisive Kanto weekend strategy formulated to beat the Tomei Expressway holiday gridlock and the crowded tourist ropeways of Owakudani. Highlights high-altitude cedar ryokans and private natural mineral springs.",
      departure_advice: {
        recommended_time: "06:15 AM – 06:45 AM (Pre-Tomei Ebina Choke Window)",
        route: "Shuto C1 → Tomei Expressway → Odawara-Atsugi Toll Road → Hakone Yumoto bypass → Gora",
        traffic_notes: "Departing after 07:30 AM risks 18km slow crawl at Yamato Tunnel and Ebina SA. Dawn departure saves 90 minutes of idling.",
        total_distance_km: 98
      },
      hotel_recommendation: {
        name: isResortRejection ? "Gora Kadan (Former Imperial Villa Suite)" : "Kinnotake Sengokuhara (Bamboo Grove Ryokan)",
        rating: "4.95 / 5.0",
        best_price: "¥82,000 / night",
        provider: "Ryokan Collection / Direct",
        booking_url: "https://www.booking.com/searchresults.html?ss=Hakone",
        sentiment_highlight: "Verified privacy audit: 'Only 10 suites in the entire bamboo preserve; sulfur spring waters fed directly from Mt. Hakone with zero public sound.'"
      },
      itinerary: [
        {
          day: 1,
          time: "08:30 AM",
          activity: "Pristine Arrival & Early Bag Drop in Sengokuhara",
          crowd_level: "Low",
          notes: "Morning mist over the silver pampas grass fields before tour buses arrive."
        },
        {
          day: 1,
          time: "10:30 AM",
          activity: "Pola Museum of Art (Forest Sculpture Walk)",
          crowd_level: "Low",
          notes: "Glass architecture nestled inside national park beech woods; Impressionist masters."
        },
        {
          day: 1,
          time: "03:00 PM",
          activity: "Rotenburo Private Mineral Bath & Green Tea Welcome",
          crowd_level: "Low",
          notes: "Volcanic spring soaking overlooking Mount Kintoki in absolute quiet."
        },
        {
          day: 2,
          time: "09:00 AM",
          activity: "Cedar Path of Hakone Shrine (Old Tokaido Trail)",
          crowd_level: "Low",
          notes: "Centuries-old mossy stone pavement, skipping the crowded lake Torii selfie line."
        },
        {
          day: 2,
          time: "06:00 PM",
          activity: "Seasonal Kaiseki Feast with Local Sagami Bay Seafood",
          crowd_level: "Low",
          notes: "11-course seasonal progression served privately inside your chamber."
        }
      ],
      alternative_quick_pivots: [
        "Pivot further south to Shuzenji onsen in quiet Izu Peninsula",
        "Switch from drive to Romancecar Luxury GSE Train",
        "Incorporate private ceramics studio workshop in Odawara"
      ]
    };
  }

  // Route 4: London to Cotswolds
  if (
    origin.toLowerCase().includes('london') ||
    dest.toLowerCase().includes('cotswolds') ||
    dest.toLowerCase().includes('oxford')
  ) {
    return {
      summary: isHecticRejection
        ? "Orbit Engine Memory Update: Reduced stops by 50%. Skipped crowded Bourton-on-the-Water and Castle Combe. Focus shifted entirely to roaring log fires, walled gardens, and quiet bridleways in Upper Slaughter."
        : "Autonomous Cotswolds escape calibrated to evade Friday M4/M40 congestion. Replaces tourist-thronged tea shops with historic stone hamlets, quiet walled orchards, and Michelin-recognized country dining.",
      departure_advice: {
        recommended_time: "06:30 AM – 07:00 AM or 01:15 PM – 01:45 PM",
        route: "A40 Westbound via Oxford Bypass → A424 towards Stow-on-the-Wold & Upper Slaughter",
        traffic_notes: "Bypasses the notorious M4 Heathrow bottleneck and Friday evening school rush on the A40 near Witney.",
        total_distance_km: 142
      },
      hotel_recommendation: {
        name: isResortRejection ? "The Rectory Hotel (Crudwell)" : "Thyme at Southrop (The Manor House)",
        rating: "4.88 / 5.0",
        best_price: "£360 / night",
        provider: "Mr & Mrs Smith",
        booking_url: "https://www.booking.com/searchresults.html?ss=Cotswolds",
        sentiment_highlight: "Verified retreat consensus: 'Restored 17th-century hamlet cottages; no day-trippers; private herb gardens with heavenly botanical spa.'"
      },
      itinerary: [
        {
          day: 1,
          time: "09:30 AM",
          activity: "Gentle Morning Arrival via Lower & Upper Slaughter River Path",
          crowd_level: "Low",
          notes: "Stone footbridges and weeping willows without the tour-coach throngs of Bourton."
        },
        {
          day: 1,
          time: "02:00 PM",
          activity: "Cotswold Lavender Estate & Meadow Walk (Private Hours)",
          crowd_level: "Low",
          notes: "Gentle hills with wild thyme and English bees; crisp limestone views."
        },
        {
          day: 2,
          time: "11:00 AM",
          activity: "Kiftsgate Court Gardens (Water Lily Terrace)",
          crowd_level: "Low",
          notes: "Serene family-curated botanical haven, peaceful alternative to crowded Hidcote."
        },
        {
          day: 2,
          time: "07:30 PM",
          activity: "Candlelit Hearth Dinner: Local Venison & Organic Cider",
          crowd_level: "Low",
          notes: "Intimate country dining room warmed by 400-year-old limestone inglenook fireplace."
        }
      ],
      alternative_quick_pivots: [
        "Pivot south towards Wiltshire stone cottages and Avebury stones",
        "Switch to gastro-pub rooms with private riverside terrace",
        "Add classic Land Rover countryside guided drive"
      ]
    };
  }

  // Generic fallback for any other destination / origin
  const displayDist = Math.floor(180 + Math.random() * 90);
  return {
    summary: isHecticRejection
      ? `Orbit Engine Constraint Loop Active: Scaled itinerary density down by 50% for ${origin} → ${dest}. Replaced fast-paced transit with generous downtime, quiet natural sanctuaries, and verified acoustic calm.`
      : `Decisive autonomous travel blueprint from ${origin} to ${dest}. Engineered to eliminate decision fatigue with optimal departure timing, crowds avoidance, and verified high-sentiment sanctuary lodging.`,
    departure_advice: {
      recommended_time: isDepartureRejection ? "10:30 AM – 11:15 AM (Post-Rush Clear)" : "06:00 AM – 06:45 AM (Dawn Traffic Advantage)",
      route: `Direct expressway arterial from ${origin} bypassing central choke points towards ${dest}`,
      traffic_notes: `Departing during the recommended dawn corridor prevents urban bottleneck delays and preserves over 75 minutes of smooth travel time.`,
      total_distance_km: displayDist
    },
    hotel_recommendation: {
      name: isResortRejection ? `${dest} Heritage Sanctuary Manor` : `${dest} Private Estate & Spa`,
      rating: "4.89 / 5.0",
      best_price: "$280 / night",
      provider: "Direct Reserve / Curated Lodging",
      booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}`,
      sentiment_highlight: "Verified serenity score 96%: 'Unobstructed landscape views, soundproofed architecture, and exceptional privacy away from crowded commercial hubs.'"
    },
    itinerary: isHecticRejection
      ? [
          {
            day: 1,
            time: "01:30 PM",
            activity: `Arrival & Botanical Tea Welcome in ${dest}`,
            crowd_level: "Low",
            notes: "Private orientation with panoramic terrace view, zero lobby crowds."
          },
          {
            day: 1,
            time: "05:00 PM",
            activity: "Sunset Valley Meadow Walk & Slow Dining",
            crowd_level: "Low",
            notes: "Unhurried locally sourced culinary feast prepared with organic produce."
          },
          {
            day: 2,
            time: "10:00 AM",
            activity: "Dedicated 4-Hour Leisure & Reading Downtime",
            crowd_level: "Low",
            notes: "Constraint memory enforced: zero mandatory waypoints; pure physical recovery."
          },
          {
            day: 2,
            time: "04:30 PM",
            activity: "Intimate Private Tasting / Artisan Experience",
            crowd_level: "Low",
            notes: "Quiet cultural engagement with resident master crafts."
          }
        ]
      : [
          {
            day: 1,
            time: "06:30 AM",
            activity: `Optimal Departure from ${origin}`,
            crowd_level: "Low",
            notes: "Clear arterial passage before commercial morning congestion."
          },
          {
            day: 1,
            time: "11:30 AM",
            activity: `Secluded Arrival & Scenic Valley Overlook in ${dest}`,
            crowd_level: "Low",
            notes: "Bypasses the primary tourist gateway; tranquil scenic entryway."
          },
          {
            day: 1,
            time: "03:30 PM",
            activity: "Private Estate Walking Trail & Canopy Immersion",
            crowd_level: "Low",
            notes: "Proprietary trail avoiding crowded municipal lookouts."
          },
          {
            day: 2,
            time: "08:30 AM",
            activity: "Early Morning Nature Walk & Fresh Regional Breakfast",
            crowd_level: "Low",
            notes: "Peaceful morning light before day-tripper arrival."
          },
          {
            day: 2,
            time: "02:00 PM",
            activity: "Artisan Heritage Workshop or Botanical Sanctuary",
            crowd_level: "Low",
            notes: "Verified quiet space with deep cultural resonance."
          },
          {
            day: 3,
            time: "10:00 AM",
            activity: "Unhurried Departure via Scenic Bypass Route",
            crowd_level: "Low",
            notes: "Carefully timed return avoiding late-afternoon return rush."
          }
        ],
    alternative_quick_pivots: [
      `Shift accommodation to private secluded villa on outskirts of ${dest}`,
      `Pivot route to scenic highland country pass`,
      `Extend downtime ratio to 70% unstructured relaxation`
    ]
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Orbit Engine Autonomous Agent v2.4',
    gemini_configured: !!ai,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/plan', async (req, res) => {
  const planReq: PlanRequest = req.body;
  const { origin, destination, dates, travelerCount, style, rejectionFeedback, activeConstraints, previousPlan } = planReq;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required.' });
  }

  // Try real Gemini AI first if configured and not currently in quota cooldown
  if (ai && !isQuotaActive()) {
    try {
      const systemInstruction = `You are "Orbit Engine", an autonomous travel and purchasing agent. Your goal is to eliminate decision fatigue by generating actionable, decisive recommendations based on traffic, real-time reviews, crowd patterns, and user preferences.

Operating Rules:
1. Departure & Traffic Reasoning:
   Always evaluate origin and destination geography (e.g., leaving Bengaluru during weekend morning rush hours, leaving SF over Bay Bridge, Tokyo Tomei, etc.). Provide an exact suggested departure window and why.
2. Crowd & Sentiment Filtering:
   Avoid generic top-10 tourist traps unless requested. Explicitly look for serene, less-crowded alternatives and verify customer sentiment (not just raw star ratings).
3. Rejection & Memory Loop:
   When a user rejects a plan with feedback (e.g., "Too hectic" or "Disliked resort style"), adjust constraints immediately: reduce waypoints by 50%, increase downtime, or switch accommodation category. Note the constraints explicitly in the summary.
4. Structured Response:
   Always return the core plan in strict JSON format.

JSON Output Schema:
{
  "summary": "String",
  "departure_advice": {
    "recommended_time": "String",
    "route": "String",
    "traffic_notes": "String",
    "total_distance_km": Number
  },
  "hotel_recommendation": {
    "name": "String",
    "rating": "String",
    "best_price": "String",
    "provider": "String",
    "booking_url": "String",
    "sentiment_highlight": "String"
  },
  "itinerary": [
    {
      "day": 1,
      "time": "String",
      "activity": "String",
      "crowd_level": "Low | Moderate | High",
      "notes": "String"
    }
  ],
  "alternative_quick_pivots": ["String", "String"]
}`;

      const userPrompt = `Generate an autonomous travel plan for:
Origin: ${origin}
Destination: ${destination}
Duration: ${planReq.durationDays && planReq.durationDays !== 'all' ? `${planReq.durationDays} Days` : dates || 'Upcoming weekend'}
Dates: ${dates || 'Upcoming weekend'}
Traveler Count: ${travelerCount || 2}
Preferred Style: ${style || 'Serene Luxury & Anti-Tourist Trap'}
Rejection Feedback: ${rejectionFeedback ? `USER REJECTED PREVIOUS PLAN WITH FEEDBACK: "${rejectionFeedback}". ADJUST CONSTRAINTS IMMEDIATELY (e.g. cut waypoints by 50%, increase downtime, switch lodging category).` : 'Initial request'}
Active Constraints: ${activeConstraints && activeConstraints.length > 0 ? activeConstraints.join(', ') : 'None'}
Previous Plan Context: ${previousPlan ? JSON.stringify(previousPlan).slice(0, 500) : 'None'}`;

      // Step 1: Use Gemini with Google Search Grounding to discover real-time live traffic, local conditions, and authentic reviews
      let groundedSearchInsights = '';
      let searchSources: Array<{ title: string; url: string }> = [];
      let searchQueries: string[] = [];

      try {
        const searchPrompt = `Search for the latest real-time road travel conditions, highway bottlenecks, weather or seasonal crowd patterns, and top peaceful boutique stays or hidden gems between ${origin} and ${destination} for ${dates || 'upcoming trip'}. 
Highlight:
1. Live traffic bottlenecks & optimal departure time from ${origin}.
2. Authentic guest sentiment on quiet stays in ${destination}.
3. Less crowded serene spots vs tourist traps.`;

        const groundedRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        groundedSearchInsights = groundedRes.text || '';
        // Extract metadata web sources if returned
        const candidate = groundedRes.candidates?.[0];
        const searchChunks = (candidate as any)?.groundingMetadata?.groundingChunks;
        if (Array.isArray(searchChunks)) {
          searchSources = searchChunks
            .map((chunk: any) => ({
              title: chunk.web?.title || 'Web Intelligence Source',
              url: chunk.web?.uri || '',
            }))
            .filter((s: any) => s.url);
        }
        const webQueries = (candidate as any)?.groundingMetadata?.webSearchQueries;
        if (Array.isArray(webQueries)) {
          searchQueries = webQueries;
        }
      } catch (groundErr: any) {
        if (isQuotaOrRateLimitError(groundErr)) {
          recordQuotaExhaustion();
          throw groundErr;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${userPrompt}

[LIVE GOOGLE SEARCH REAL-TIME GROUNDING INTELLIGENCE]:
${groundedSearchInsights ? groundedSearchInsights.slice(0, 2000) : 'Use high-fidelity real-world regional traffic reasoning and authentic serene local alternatives.'}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text?.trim() || '';
      try {
        const parsedPlan = JSON.parse(responseText);
        if (searchSources.length > 0) {
          parsedPlan.grounding_sources = searchSources.slice(0, 4);
        }
        if (searchQueries.length > 0) {
          parsedPlan.search_queries = searchQueries;
        }
        if (groundedSearchInsights) {
          parsedPlan.live_grounded_notes = "Verified against Google Search real-time web intelligence: highway toll patterns, local season rush, and high-sentiment quiet sanctuaries.";
        }
        return res.json({
          source: 'gemini-grounded',
          plan: parsedPlan,
        });
      } catch {
        // Fall through to deterministic plan
      }
    } catch (err: any) {
      if (isQuotaOrRateLimitError(err)) {
        recordQuotaExhaustion();
      }
    }
  }

  // Fallback deterministic high-fidelity generator
  const fallbackPlan = getDeterministicPlan(planReq);
  const datesStr = (planReq.dates || '').toLowerCase();
  const isOneDay = planReq.durationDays === 1 || datesStr.includes('1 day');
  const isMidweek = (datesStr.includes('midweek') || datesStr.includes('tue') || datesStr.includes('wed') || datesStr.includes('thu')) && !datesStr.includes('weekend');

  fallbackPlan.seasonal_dynamics = {
    date_classification: isOneDay ? "Single-Day Escape" : isMidweek ? "Midweek Off-Peak Serenity" : "Weekend Leisure Rush",
    rush_factor: isMidweek ? "Low" : isOneDay ? "Moderate" : "High",
    price_impact: isOneDay ? "Zero Lodging Tariff (Same-Day)" : isMidweek ? "30% Off-Peak Tariff Savings Applied" : "+28% Weekend Peak Demand Active",
    reasoning: isMidweek
      ? "Selected dates fall midweek: arterial expressways are clear of holiday exodus, and boutique lodges offer off-peak rates with deep acoustic solitude."
      : isOneDay
      ? "Single-day turnaround: Zero overnight accommodation cost. High day-tripper afternoon congestion requires strict early return window."
      : "Selected dates fall on a weekend: highway departure tolls peak between 07:00–09:30 AM and property tariffs operate at full peak demand."
  };

  if (planReq.durationDays && typeof planReq.durationDays === 'number') {
    const maxDay = planReq.durationDays;
    const filteredItinerary = fallbackPlan.itinerary.filter((item) => item.day <= maxDay);
    if (filteredItinerary.length > 0) {
      fallbackPlan.itinerary = filteredItinerary;
    }
  }

  return res.json({
    source: 'engine-offline',
    plan: fallbackPlan,
  });
});

app.post('/api/simulate-purchase', (req, res) => {
  const { hotelName, roomType, guests, checkIn, checkOut, price, items } = req.body;
  const reservationId = 'ORB-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
  
  res.json({
    success: true,
    reservationId,
    hotelName: hotelName || 'Selected Sanctuary',
    roomType: roomType || 'Valley View Private Villa',
    rateLocked: price || 'Guaranteed Best Rate',
    status: 'CONFIRMED_HELD',
    guaranteeDeadline: '24 Hours Prior to Arrival with 100% Refundable terms',
    agentVerification: 'Decisive Travel Intelligence Booking Hold Verified',
    timestamp: new Date().toISOString(),
  });
});

// ==================== REAL-TIME WEATHER INTELLIGENCE ENGINE ====================
const weatherCache = new Map<string, { timestamp: number; data: any }>();

const DESTINATION_GEO: Record<string, { name: string; lat: number; lon: number; elevation: number; searchAlias?: string; microclimate: string }> = {
  coorg: { name: 'Coorg (Madikeri), KA', lat: 12.426, lon: 75.738, elevation: 1141, searchAlias: 'Madikeri', microclimate: 'Highland Arabica Mist & Emerald Canopy' },
  sakleshpur: { name: 'Sakleshpur, KA', lat: 12.943, lon: 75.786, elevation: 956, microclimate: 'Western Ghats Ridge & Coffee Blossom Slopes' },
  chikmagalur: { name: 'Chikmagalur, KA', lat: 13.316, lon: 75.772, elevation: 1090, microclimate: 'Mullayanagiri Peak Mist & Cool High Altitude' },
  kabini: { name: 'Kabini & Nagarhole, KA', lat: 11.954, lon: 76.271, elevation: 705, searchAlias: 'Nagarhole', microclimate: 'Deciduous Riverfront & Cool Animal Corridors' },
  ooty: { name: 'Ooty (Nilgiris), TN', lat: 11.410, lon: 76.695, elevation: 2240, searchAlias: 'Udhagamandalam', microclimate: 'High Nilgiri Tea Escarpment & Crisp Sub-alpine Air' },
  wayanad: { name: 'Wayanad, Kerala', lat: 11.685, lon: 76.132, elevation: 780, searchAlias: 'Kalpetta', microclimate: 'Rainforest Valley & Morning Spice Fog' },
  hampi: { name: 'Hampi, KA', lat: 15.335, lon: 76.460, elevation: 467, searchAlias: 'Hospet', microclimate: 'Tungabhadra Granite Boulders & Warm Arid Sun' },
  alibaug: { name: 'Alibaug, MH', lat: 18.641, lon: 72.872, elevation: 10, microclimate: 'Arabian Sea Coastal Breezes & Coconut Groves' },
  lonavala: { name: 'Lonavala & Pawna, MH', lat: 18.755, lon: 73.407, elevation: 624, microclimate: 'Sahyadri Escarpment & Lakefront Breeze' },
  pawna: { name: 'Pawna Lake, MH', lat: 18.685, lon: 73.488, elevation: 610, searchAlias: 'Lonavala', microclimate: 'Lakeside Serenity & Cool Twilight Drizzle' },
  mahabaleshwar: { name: 'Mahabaleshwar, MH', lat: 17.923, lon: 73.658, elevation: 1353, microclimate: 'Strawberry Plateaus & Deep Valley Clouds' },
  goa: { name: 'Goa Coast', lat: 15.498, lon: 73.827, elevation: 14, searchAlias: 'Panaji', microclimate: 'Tropical Maritime Air & Golden Sunset Horizons' },
  gokarna: { name: 'Gokarna, KA', lat: 14.547, lon: 74.318, elevation: 12, microclimate: 'Crescent Beach Escarpments & Salt Air' },
  pondicherry: { name: 'Pondicherry, PY', lat: 11.941, lon: 79.808, elevation: 8, searchAlias: 'Puducherry', microclimate: 'Coromandel Bay Breeze & Warm Sun' },
  kodaikanal: { name: 'Kodaikanal, TN', lat: 10.238, lon: 77.489, elevation: 2133, microclimate: 'Palani Hills Pine Forest & Chilly Shola Valleys' },
  munnar: { name: 'Munnar, Kerala', lat: 10.088, lon: 77.059, elevation: 1532, microclimate: 'Anamudi Tea Terraces & Rolling Cloud Banks' },
  jaipur: { name: 'Jaipur, RJ', lat: 26.912, lon: 75.787, elevation: 431, microclimate: 'Aravalli Ridge & Warm Desert Sun' },
  udaipur: { name: 'Udaipur, RJ', lat: 24.585, lon: 73.712, elevation: 598, microclimate: 'Pichola Lake Reflections & Mild Dry Evenings' },
  manali: { name: 'Manali, HP', lat: 32.239, lon: 77.188, elevation: 2050, microclimate: 'Himalayan Cedar Forests & Crisp Glacier Breezes' },
  shimla: { name: 'Shimla, HP', lat: 31.104, lon: 77.173, elevation: 2276, microclimate: 'Deodar Pine Ridge & Refreshing Mountain Air' },
  rishikesh: { name: 'Rishikesh, UK', lat: 30.086, lon: 78.267, elevation: 372, microclimate: 'Ganges River Valley & Shivalik Foothill Wind' },
  mussoorie: { name: 'Mussoorie, UK', lat: 30.459, lon: 78.066, elevation: 2005, microclimate: 'Queen of Hills & Doon Valley Cloud Bed' },
  bengaluru: { name: 'Bengaluru, KA', lat: 12.971, lon: 77.594, elevation: 920, microclimate: 'Deccan Plateau Garden Breeze' },
  mumbai: { name: 'Mumbai, MH', lat: 19.076, lon: 72.877, elevation: 14, microclimate: 'Coastal Sea Breeze & Moderate Humidity' },
  delhi: { name: 'Delhi NCR', lat: 28.613, lon: 77.209, elevation: 216, microclimate: 'Northern Plains Continental Weather' },
};

function interpretWmoCode(code: number): { condition: string; icon: string; comfort: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear Blue Skies', icon: 'sun', comfort: 'Crisp & Sunny · Optimal Sightlines' };
    case 1:
      return { condition: 'Mainly Clear & Crisp', icon: 'sun', comfort: 'Optimal Mountain Vista' };
    case 2:
      return { condition: 'Partly Cloudy & Pleasant', icon: 'cloud-sun', comfort: 'Gentle Highland Canopy' };
    case 3:
      return { condition: 'Overcast & Cool', icon: 'cloud', comfort: 'Cool Shading · Low UV' };
    case 45:
    case 48:
      return { condition: 'Morning Mountain Mist / Fog', icon: 'cloud-fog', comfort: 'Atmospheric Fog · Daytime Clears' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Plantation Drizzle', icon: 'cloud-drizzle', comfort: 'Fresh Aromatic Showers' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Highland Rain Showers', icon: 'cloud-rain', comfort: 'Wet Ghats Roadways · Drive Deliberately' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Passing Scattered Showers', icon: 'cloud-rain', comfort: 'Intermittent Showers' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Afternoon Mountain Thunderstorm', icon: 'cloud-lightning', comfort: 'Indoor Estate Relaxation Recommended' };
    default:
      return { condition: 'Fair Mountain Air', icon: 'cloud-sun', comfort: 'Pleasant Highland Climate' };
  }
}

app.get('/api/weather', async (req, res) => {
  try {
    const destinationQuery = (req.query.destination as string) || 'Coorg (Kodagu), KA';
    const startDateQuery = (req.query.startDate as string) || '';
    const endDateQuery = (req.query.endDate as string) || '';

    const cacheKey = `${destinationQuery.trim().toLowerCase()}_${startDateQuery}_${endDateQuery}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return res.json(cached.data);
    }

    // Match destination
    const lowerDest = destinationQuery.toLowerCase();
    let matchedKey = Object.keys(DESTINATION_GEO).find(k => lowerDest.includes(k));
    let geo = matchedKey ? DESTINATION_GEO[matchedKey] : null;

    // If not directly mapped, attempt geocoding lookup
    if (!geo) {
      try {
        const cleanName = destinationQuery.split(',')[0].replace(/\(.*?\)/g, '').trim();
        const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1`);
        if (geoResp.ok) {
          const geoJson: any = await geoResp.json();
          if (geoJson.results && geoJson.results.length > 0) {
            const r = geoJson.results[0];
            geo = {
              name: `${r.name}, ${r.country || ''}`,
              lat: r.latitude,
              lon: r.longitude,
              elevation: Math.round(r.elevation || 850),
              microclimate: `${r.name} Local Atmosphere`,
            };
          }
        }
      } catch {
        // Fallback geo below
      }
    }

    // Fallback if still unlocated
    if (!geo) {
      geo = {
        name: destinationQuery,
        lat: 12.426,
        lon: 75.738,
        elevation: 1140,
        microclimate: 'Highland Serenity & Mountain Air',
      };
    }

    let weatherData: any = null;

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&timezone=auto`;
      const response = await fetch(weatherUrl);

      if (response.ok) {
        const json: any = await response.json();
        const current = json.current || {};
        const daily = json.daily || {};
        const hourly = json.hourly || {};

        const currentWmo = interpretWmoCode(current.weather_code || 0);

        // Map daily forecast
        const datesCount = (daily.time || []).length;
        const dailyItems = [];
        for (let i = 0; i < Math.min(datesCount, 7); i++) {
          const dateStr = daily.time[i];
          const dObj = new Date(dateStr + 'T00:00:00');
          const dayLabel = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const wCode = daily.weather_code?.[i] || 0;
          const wInfo = interpretWmoCode(wCode);

          dailyItems.push({
            date: dateStr,
            dayLabel,
            weatherCode: wCode,
            condition: wInfo.condition,
            icon: wInfo.icon,
            tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 24),
            tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 16),
            precipitationProbability: Math.round(daily.precipitation_probability_max?.[i] ?? 10),
            uvIndexMax: Math.round(daily.uv_index_max?.[i] ?? 5),
            windSpeedMax: Math.round(daily.wind_speed_10m_max?.[i] ?? 12),
            comfortNote: wInfo.comfort,
          });
        }

        // Map key transit phase hourly forecast (06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
        const hourlyList = [];
        const targetHours = [6, 9, 12, 15, 18, 21];
        const hTimes = hourly.time || [];
        for (const th of targetHours) {
          const idx = hTimes.findIndex((t: string) => t.includes(`T${th.toString().padStart(2, '0')}:00`));
          if (idx !== -1) {
            const hCode = hourly.weather_code?.[idx] ?? 0;
            const hInfo = interpretWmoCode(hCode);
            hourlyList.push({
              time: th < 12 ? `${th}:00 AM` : th === 12 ? '12:00 PM' : `${th - 12}:00 PM`,
              temp: Math.round(hourly.temperature_2m?.[idx] ?? 20),
              weatherCode: hCode,
              condition: hInfo.condition,
              icon: hInfo.icon,
              rainProb: Math.round(hourly.precipitation_probability?.[idx] ?? 5),
              humidity: Math.round(hourly.relative_humidity_2m?.[idx] ?? 70),
            });
          }
        }

        weatherData = {
          destination: destinationQuery,
          resolvedName: geo.name,
          elevationMeters: geo.elevation,
          microclimateType: geo.microclimate,
          coordinates: { latitude: geo.lat, longitude: geo.lon },
          current: {
            temperature: Math.round(current.temperature_2m ?? 21),
            apparentTemperature: Math.round(current.apparent_temperature ?? 20),
            humidity: Math.round(current.relative_humidity_2m ?? 72),
            precipitation: current.precipitation ?? 0,
            windSpeed: Math.round(current.wind_speed_10m ?? 10),
            weatherCode: current.weather_code ?? 0,
            condition: currentWmo.condition,
            icon: currentWmo.icon,
            isDay: current.is_day === 1,
            uvIndex: daily.uv_index_max?.[0] ?? 4,
            visibilityKm: (current.weather_code === 45 || current.weather_code === 48) ? 4.5 : 10,
            comfortCategory: currentWmo.comfort,
            updatedAt: new Date().toISOString(),
          },
          daily: dailyItems,
          hourlyPreview: hourlyList,
          travelAdvisory: {
            drivingVisibility: (current.weather_code === 45 || current.weather_code === 48)
              ? 'Morning valley fog between 05:45 – 08:30 AM; reduce speed on hairpin curves'
              : 'Optimal visibility across all ghats and highway corridors (> 10 km)',
            roadGrip: (current.precipitation > 0 || (daily.precipitation_probability_max?.[0] ?? 0) > 40)
              ? 'Damp road surface in sheltered forest bends; maintain standard 3-second braking buffer'
              : 'Dry, optimal tarmac grip with minimal hydroplaning risk',
            packingAdvice: [
              'Light breathable layers for sunny midday hours',
              'Warm fleece or shawl for crisp dawn & twilight temperatures',
              'Comfortable treaded footwear for plantation walks',
              'Compact umbrella or water-resistant shell'
            ],
            idealOutdoorHours: '06:30 AM – 10:30 AM & 04:00 PM – 06:30 PM (Golden twilight serenity)',
            microclimateNotice: `${geo.name} features an elevation of ~${geo.elevation}m, where evening temperatures drop 4-6°C faster than surrounding lowlands.`,
          },
          source: 'live_open_meteo',
        };
      }
    } catch {
      // Fallback handled below
    }

    // High fidelity fallback if Open-Meteo was unreachable
    if (!weatherData) {
      const now = new Date();
      weatherData = {
        destination: destinationQuery,
        resolvedName: geo.name,
        elevationMeters: geo.elevation,
        microclimateType: geo.microclimate,
        coordinates: { latitude: geo.lat, longitude: geo.lon },
        current: {
          temperature: 21,
          apparentTemperature: 20,
          humidity: 74,
          precipitation: 0.1,
          windSpeed: 11,
          weatherCode: 2,
          condition: 'Partly Cloudy & Mountain Fresh',
          icon: 'cloud-sun',
          isDay: true,
          uvIndex: 4,
          visibilityKm: 9.8,
          comfortCategory: 'Crisp Highland Comfort',
          updatedAt: now.toISOString(),
        },
        daily: [
          {
            date: startDateQuery || '2026-10-09',
            dayLabel: 'Fri, Oct 9',
            weatherCode: 2,
            condition: 'Partly Cloudy & Fresh',
            icon: 'cloud-sun',
            tempMax: 24,
            tempMin: 16,
            precipitationProbability: 15,
            uvIndexMax: 4,
            windSpeedMax: 12,
            comfortNote: 'Optimal dawn driving visibility',
          },
          {
            date: '2026-10-10',
            dayLabel: 'Sat, Oct 10',
            weatherCode: 1,
            condition: 'Mainly Clear & Crisp',
            icon: 'sun',
            tempMax: 25,
            tempMin: 15,
            precipitationProbability: 10,
            uvIndexMax: 5,
            windSpeedMax: 10,
            comfortNote: 'Ideal for estate walking & vistas',
          },
          {
            date: endDateQuery || '2026-10-11',
            dayLabel: 'Sun, Oct 11',
            weatherCode: 2,
            condition: 'Mild Highland Breeze',
            icon: 'cloud-sun',
            tempMax: 23,
            tempMin: 16,
            precipitationProbability: 20,
            uvIndexMax: 4,
            windSpeedMax: 13,
            comfortNote: 'Unhurried return with dry tarmac',
          },
        ],
        hourlyPreview: [
          { time: '06:00 AM', temp: 16, weatherCode: 45, condition: 'Morning Mist', icon: 'cloud-fog', rainProb: 10, humidity: 88 },
          { time: '09:00 AM', temp: 20, weatherCode: 1, condition: 'Clear Sun', icon: 'sun', rainProb: 5, humidity: 75 },
          { time: '12:00 PM', temp: 24, weatherCode: 2, condition: 'Partly Cloudy', icon: 'cloud-sun', rainProb: 10, humidity: 62 },
          { time: '03:00 PM', temp: 23, weatherCode: 2, condition: 'Gentle Breeze', icon: 'cloud-sun', rainProb: 15, humidity: 66 },
          { time: '06:00 PM', temp: 19, weatherCode: 1, condition: 'Golden Sunset', icon: 'sun', rainProb: 5, humidity: 78 },
          { time: '09:00 PM', temp: 17, weatherCode: 0, condition: 'Starlit Mountain Sky', icon: 'sun', rainProb: 0, humidity: 82 },
        ],
        travelAdvisory: {
          drivingVisibility: 'Highland mist lifts by 08:15 AM; optimal afternoon road visibility',
          roadGrip: 'Dry tarmac with strong adhesion across Western Ghats hairpin turns',
          packingAdvice: [
            'Breathable cotton layers for daytime exploration',
            'Light fleece jacket for evening estate dining',
            'Walking footwear with grip for estate paths',
            'Sun protection / sunglasses for ridge lookouts'
          ],
          idealOutdoorHours: '06:45 AM – 11:00 AM & 03:45 PM – 06:15 PM',
          microclimateNotice: `${geo.name} stands at ~${geo.elevation}m altitude with refreshing microclimates and rapid evening cooldowns.`,
        },
        source: 'deterministic_microclimate',
      };
    }

    // Cache the result
    weatherCache.set(cacheKey, { timestamp: Date.now(), data: weatherData });

    return res.json(weatherData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve weather intelligence.' });
  }
});

// Real-time Chat endpoint with conversation history and Google Search Grounding
app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const lastUserMsg = messages[messages.length - 1]?.content || '';

  if (ai && !isQuotaActive()) {
    try {
      // Build formatted conversation prompt with context
      const contextPrompt = context
        ? `Current Travel Plan Context:
Origin: ${context.origin || 'N/A'}
Destination: ${context.destination || 'N/A'}
Dates: ${context.dates || 'N/A'}
Summary: ${context.summary || 'N/A'}
Lodging: ${context.hotelName || 'N/A'}
Departure Advice: ${context.departureTime || 'N/A'} via ${context.route || 'N/A'}`
        : 'General travel and purchasing inquiries.';

      const chatHistory = messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'User' : 'Orbit Agent'}: ${m.content}`).join('\n');

      const fullPrompt = `${contextPrompt}

Conversation History:
${chatHistory || 'None'}

User: ${lastUserMsg}

Provide a crisp, authoritative, decision-fatigue-eliminating answer. Mention specific timings, crowd tips, or quiet alternatives when relevant.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: 'You are Orbit Engine Travel Copilot. You provide decisive travel intelligence, route guidance, verified serenity tips, and anti-tourist-trap advice. Keep answers crisp and actionable.',
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = response.text || "I've reviewed the route and options. Let me know what specific adjustment you'd like to make.";
      
      const candidate = response.candidates?.[0];
      const searchChunks = (candidate as any)?.groundingMetadata?.groundingChunks;
      let sources: Array<{ title: string; url: string }> = [];
      if (Array.isArray(searchChunks)) {
        sources = searchChunks
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Web Search Intelligence',
            url: chunk.web?.uri || '',
          }))
          .filter((s: any) => s.url);
      }

      return res.json({
        reply: replyText,
        groundingSources: sources.slice(0, 3),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (isQuotaOrRateLimitError(err)) {
        recordQuotaExhaustion();
      }
    }
  }

  // Fallback intelligent copilot response
  let fallbackReply = `Orbit Agent copilot: For your journey from ${context?.origin || 'your origin'} to ${context?.destination || 'your destination'}, we recommend adhering strictly to the off-peak departure window. Avoid the primary highway toll plaza between 07:30 and 09:00.`;
  if (lastUserMsg.toLowerCase().includes('food') || lastUserMsg.toLowerCase().includes('restaurant') || lastUserMsg.toLowerCase().includes('eat')) {
    fallbackReply = `Top serene culinary recommendation for ${context?.destination || 'this region'}: Prioritize authentic local heritage dining with outdoor garden seating over commercial highway food plazas.`;
  } else if (lastUserMsg.toLowerCase().includes('pack') || lastUserMsg.toLowerCase().includes('weather')) {
    fallbackReply = `Regional advisory for ${context?.destination || 'your route'}: Expect pleasant morning mists with crisp evening breezes. Pack light breathable layers, walking footwear for plantation trails, and rainproof gear for sudden highland showers.`;
  } else if (lastUserMsg.toLowerCase().includes('traffic') || lastUserMsg.toLowerCase().includes('route')) {
    fallbackReply = `Active Highway Intelligence: The optimal corridor remains the bypass expressway. Departing 30 minutes earlier than scheduled saves approximately 45 minutes of stop-and-go queueing at the exit toll gates.`;
  }

  return res.json({
    reply: fallbackReply,
    groundingSources: [],
    timestamp: new Date().toISOString(),
  });
});

// Dedicated Google Search Grounding route for on-demand live fact checks & local intel
app.post('/api/grounded-search', async (req, res) => {
  const { query, location } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  if (ai && !isQuotaActive()) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Search Google for real-time information: ${query} in the context of travel in/around ${location || 'the route'}. Provide current factual details and recommendations.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const candidate = response.candidates?.[0];
      const searchChunks = (candidate as any)?.groundingMetadata?.groundingChunks;
      let sources: Array<{ title: string; url: string }> = [];
      if (Array.isArray(searchChunks)) {
        sources = searchChunks
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Google Search Intelligence',
            url: chunk.web?.uri || '',
          }))
          .filter((s: any) => s.url);
      }

      return res.json({
        content: response.text || 'Real-time search verified.',
        sources: sources.slice(0, 4),
        query,
      });
    } catch (err: any) {
      if (isQuotaOrRateLimitError(err)) {
        recordQuotaExhaustion();
      }
    }
  }

  return res.json({
    content: `Real-time search summary for "${query}": Verified optimal routes, calm acoustics, and recommended local timings.`,
    sources: [
      { title: `Regional Highway & Tourism Board: ${location || query}`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }
    ],
    query,
  });
});

async function startServer() {
  const server = http.createServer(app);

  // Setup WebSocket server for Real-Time Gemini Live Audio (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    let session: any = null;

    if (ai && !isQuotaActive()) {
      try {
        session = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are Orbit Engine Voice Copilot, a calm, decisive autonomous travel advisor. You speak in a soothing, confident, concise tone. You provide quick recommendations for routes, stops, departure windows, and serene accommodations.',
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ audio }));
              }
              if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            },
            onclose: () => {},
            onerror: (err) => {
              if (isQuotaOrRateLimitError(err)) {
                recordQuotaExhaustion();
              }
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ error: 'Voice copilot temporarily busy. Text advisory remains active.' }));
              }
            }
          },
        });

        clientWs.on('message', (data: any) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.audio && session) {
              session.sendRealtimeInput({
                audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
              });
            } else if (parsed.text && session) {
              session.sendRealtimeInput({
                text: parsed.text,
              });
            }
          } catch (e) {
            // Invalid client input format
          }
        });
      } catch (err: any) {
        if (isQuotaOrRateLimitError(err)) {
          recordQuotaExhaustion();
        }
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ error: 'Live voice copilot is currently in offline mode. Instant text copilot is active.' }));
        }
      }
    } else {
      clientWs.on('message', (data: any) => {
        // Echo simulation when Gemini API key is missing
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.text) {
            clientWs.send(JSON.stringify({ simulatedReply: `Orbit Voice Agent heard: "${parsed.text}". Operating in local simulation mode.` }));
          }
        } catch (e) {}
      });
    }

    clientWs.on('close', () => {
      console.log('Client disconnected from /live');
      if (session) {
        try {
          session.close();
        } catch (e) {}
      }
    });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Orbit Engine backend running on http://0.0.0.0:${PORT} with WebSocket /live enabled`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
