import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Route,
  Navigation,
  Compass,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Mountain,
  Coffee,
  CheckCircle2,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DepartureAdvice, SeasonalDynamics } from '../types';

interface RouteWaypoint {
  id: string;
  name: string;
  role: 'origin' | 'choke_bypass' | 'scenic_oasis' | 'ascent' | 'destination';
  label: string;
  distanceKm: number;
  kmMarker: string;
  estTime: string;
  status: string;
  roadCondition: string;
  trafficVerdict: 'optimal' | 'bypassed' | 'scenic' | 'arrival';
  elevationM: number;
  x: number;
  y: number;
  description: string;
  speedLimit: string;
}

interface RouteVisualizationMapProps {
  origin: string;
  destination: string;
  departureAdvice?: DepartureAdvice;
  seasonalDynamics?: SeasonalDynamics;
  className?: string;
}

export const RouteVisualizationMap: React.FC<RouteVisualizationMapProps> = ({
  origin,
  destination,
  departureAdvice,
  seasonalDynamics,
  className = '',
}) => {
  // State for interactivity
  const [activeWaypointId, setActiveWaypointId] = useState<string>('wp-2');
  const [hoveredWaypointId, setHoveredWaypointId] = useState<string | null>(null);
  const [routeMode, setRouteMode] = useState<'recommended' | 'comparison'>('recommended');
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);
  const [showTopoContours, setShowTopoContours] = useState<boolean>(true);
  
  // Transit simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [transitProgress, setTransitProgress] = useState<number>(0.35); // 0 to 1
  const [carPosition, setCarPosition] = useState<{ x: number; y: number }>({ x: 390, y: 160 });

  const pathRef = useRef<SVGPathElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const totalDistance = departureAdvice?.total_distance_km || 220;
  const departureTime = departureAdvice?.recommended_time || '05:45 AM';
  const corridorRoute = departureAdvice?.route || 'Scenic Highway Bypass Corridor';

  // Extract clean city labels
  const originClean = origin.split(',')[0].trim();
  const destClean = destination.split(',')[0].trim();

  // Generate customized waypoints based on origin & destination
  const waypoints = useMemo<RouteWaypoint[]>(() => {
    const oLower = origin.toLowerCase();
    const dLower = destination.toLowerCase();

    // 1. Bengaluru -> Sakleshpur
    if (oLower.includes('bengaluru') && dLower.includes('sakleshpur')) {
      return [
        {
          id: 'wp-0',
          name: `${originClean} Departure Hub`,
          role: 'origin',
          label: 'Nelamangala Gateway Exit',
          distanceKm: 0,
          kmMarker: 'Km 0',
          estTime: departureTime,
          status: 'Dawn Departure Gate',
          roadCondition: '8-Lane Elevated Expressway',
          trafficVerdict: 'optimal',
          elevationM: 920,
          x: 80,
          y: 240,
          speedLimit: '80 km/h',
          description: 'Dawn transit clears the Nelamangala toll bottleneck before 06:45 AM peak commercial queues.',
        },
        {
          id: 'wp-1',
          name: 'Kunigal - Bellur Arterial',
          role: 'choke_bypass',
          label: 'Bellur Cross Fast Transit',
          distanceKm: Math.round(totalDistance * 0.32),
          kmMarker: `Km ${Math.round(totalDistance * 0.32)}`,
          estTime: '06:50 AM',
          status: 'Free-flow Cruising',
          roadCondition: '4-Lane Smooth NH75 Corridor',
          trafficVerdict: 'optimal',
          elevationM: 810,
          x: 230,
          y: 215,
          speedLimit: '100 km/h',
          description: 'High-speed divided carriageway with zero pedestrian crossings; clears toll gate in 45 seconds.',
        },
        {
          id: 'wp-2',
          name: 'Hassan Dual-Carriageway Bypass',
          role: 'choke_bypass',
          label: 'Hassan City Choke Bypass',
          distanceKm: Math.round(totalDistance * 0.65),
          kmMarker: `Km ${Math.round(totalDistance * 0.65)}`,
          estTime: '07:45 AM',
          status: 'Decisive Bypass Enforced',
          roadCondition: 'Ring Road Bypass Arterial',
          trafficVerdict: 'bypassed',
          elevationM: 956,
          x: 390,
          y: 160,
          speedLimit: '70 km/h',
          description: 'Autonomous route diverts around Hassan city market choke points, eliminating 35 min congestion.',
        },
        {
          id: 'wp-3',
          name: 'Hemavathi River & Arabica Foothills',
          role: 'scenic_oasis',
          label: 'Ghats Scenic Transition',
          distanceKm: Math.round(totalDistance * 0.85),
          kmMarker: `Km ${Math.round(totalDistance * 0.85)}`,
          estTime: '08:20 AM',
          status: 'Scenic Vista Pitstop',
          roadCondition: 'Curved Mountain Highway',
          trafficVerdict: 'scenic',
          elevationM: 990,
          x: 560,
          y: 185,
          speedLimit: '60 km/h',
          description: 'Fresh Arabica estate breezes, riverside lookout, and cool morning Western Ghats mist.',
        },
        {
          id: 'wp-4',
          name: `${destClean} Sanctuary`,
          role: 'destination',
          label: 'Western Ghats Mist Ridge',
          distanceKm: totalDistance,
          kmMarker: `Km ${totalDistance}`,
          estTime: '08:50 AM',
          status: 'Arrival & Sanctuary Check-in',
          roadCondition: 'Private Coffee Estate Trail',
          trafficVerdict: 'arrival',
          elevationM: 1040,
          x: 730,
          y: 100,
          speedLimit: '30 km/h',
          description: 'Arrival at tranquil heritage plantation. Complete acoustic serenity with zero tourist congestion.',
        },
      ];
    }

    // 2. Bengaluru -> Coorg
    if (oLower.includes('bengaluru') && dLower.includes('coorg')) {
      return [
        {
          id: 'wp-0',
          name: `${originClean} Departure Hub`,
          role: 'origin',
          label: 'NICE Road Kengeri Arterial',
          distanceKm: 0,
          kmMarker: 'Km 0',
          estTime: departureTime,
          status: 'Dawn Departure Gate',
          roadCondition: 'Expressway Interchange',
          trafficVerdict: 'optimal',
          elevationM: 920,
          x: 80,
          y: 240,
          speedLimit: '80 km/h',
          description: 'Early morning exit prevents weekend NICE Road toll congestion and merges smoothly onto the expressway.',
        },
        {
          id: 'wp-1',
          name: 'Srirangapatna Heritage Artery',
          role: 'choke_bypass',
          label: 'Expressway Fast Transit',
          distanceKm: Math.round(totalDistance * 0.45),
          kmMarker: `Km ${Math.round(totalDistance * 0.45)}`,
          estTime: '07:10 AM',
          status: 'Smooth High-Speed Leg',
          roadCondition: '10-Lane Mysore Access Corridor',
          trafficVerdict: 'optimal',
          elevationM: 715,
          x: 230,
          y: 215,
          speedLimit: '100 km/h',
          description: 'Cruising past the Cauvery river basin prior to weekend traffic surge.',
        },
        {
          id: 'wp-2',
          name: 'Hunsur - Periyapatna Coffee Belt',
          role: 'choke_bypass',
          label: 'Mysuru City Ring Bypass',
          distanceKm: Math.round(totalDistance * 0.7),
          kmMarker: `Km ${Math.round(totalDistance * 0.7)}`,
          estTime: '08:00 AM',
          status: 'Autonomous Rural Bypass',
          roadCondition: 'Tree-Lined 2-Lane State Highway',
          trafficVerdict: 'bypassed',
          elevationM: 825,
          x: 390,
          y: 160,
          speedLimit: '65 km/h',
          description: 'Diverts around urban tourist queues through aromatic tobacco and spice villages.',
        },
        {
          id: 'wp-3',
          name: 'Kushalnagar & Cauvery Forest Pass',
          role: 'scenic_oasis',
          label: 'Bylakuppe Bamboo Oasis',
          distanceKm: Math.round(totalDistance * 0.88),
          kmMarker: `Km ${Math.round(totalDistance * 0.88)}`,
          estTime: '08:45 AM',
          status: 'Scenic Mountain Threshold',
          roadCondition: 'Canopy Forest Road',
          trafficVerdict: 'scenic',
          elevationM: 890,
          x: 560,
          y: 185,
          speedLimit: '50 km/h',
          description: 'Entering Kodagu district. Dense bamboo canopy and gentle river breezes.',
        },
        {
          id: 'wp-4',
          name: `${destClean} Sanctuary`,
          role: 'destination',
          label: 'Madikeri Arabica Sanctuary',
          distanceKm: totalDistance,
          kmMarker: `Km ${totalDistance}`,
          estTime: '09:30 AM',
          status: 'Arrival at Secluded Estate',
          roadCondition: 'Private Heritage Plantation Drive',
          trafficVerdict: 'arrival',
          elevationM: 1150,
          x: 730,
          y: 100,
          speedLimit: '35 km/h',
          description: 'Arrival at mist-clad coffee sanctuary. High elevation, zero noise pollution, private verandah check-in.',
        },
      ];
    }

    // 3. Bengaluru -> Kabini / Nagarhole
    if (oLower.includes('bengaluru') && (dLower.includes('kabini') || dLower.includes('nagarhole'))) {
      return [
        {
          id: 'wp-0',
          name: `${originClean} Departure Hub`,
          role: 'origin',
          label: 'Kanakapura Corridor Gate',
          distanceKm: 0,
          kmMarker: 'Km 0',
          estTime: departureTime,
          status: 'Dawn Departure',
          roadCondition: 'Divided Highway',
          trafficVerdict: 'optimal',
          elevationM: 920,
          x: 80,
          y: 240,
          speedLimit: '80 km/h',
          description: 'Dawn departure evades Friday evening expressway snarls completely.',
        },
        {
          id: 'wp-1',
          name: 'Malavalli & Bannur Rural Corridor',
          role: 'choke_bypass',
          label: 'Mysore Urban Ring Bypass',
          distanceKm: Math.round(totalDistance * 0.4),
          kmMarker: `Km ${Math.round(totalDistance * 0.4)}`,
          estTime: '07:05 AM',
          status: 'Rural Bypass Active',
          roadCondition: 'Smooth Village Arterial',
          trafficVerdict: 'bypassed',
          elevationM: 680,
          x: 230,
          y: 215,
          speedLimit: '75 km/h',
          description: 'Bypasses Mysore city ring road entirely via quiet sugarcane belt bypass roads.',
        },
        {
          id: 'wp-2',
          name: 'Heggadadevanakote (HD Kote)',
          role: 'choke_bypass',
          label: 'Kabini Waterway Threshold',
          distanceKm: Math.round(totalDistance * 0.72),
          kmMarker: `Km ${Math.round(totalDistance * 0.72)}`,
          estTime: '08:15 AM',
          status: 'Scenic Transition',
          roadCondition: 'Undulating Rural Artery',
          trafficVerdict: 'optimal',
          elevationM: 710,
          x: 390,
          y: 160,
          speedLimit: '60 km/h',
          description: 'Passing through quiet water channels and paddy fields into forest reserve buffer.',
        },
        {
          id: 'wp-3',
          name: 'Nagarhole Forest Boundary',
          role: 'scenic_oasis',
          label: 'Wildlife Buffer Zone',
          distanceKm: Math.round(totalDistance * 0.88),
          kmMarker: `Km ${Math.round(totalDistance * 0.88)}`,
          estTime: '08:45 AM',
          status: 'Spotted Deer Sightings',
          roadCondition: 'Eco Forest Corridor',
          trafficVerdict: 'scenic',
          elevationM: 740,
          x: 560,
          y: 185,
          speedLimit: '40 km/h',
          description: 'Canopy road where forest elephants and chital herds frequently cross early morning.',
        },
        {
          id: 'wp-4',
          name: `${destClean} Sanctuary`,
          role: 'destination',
          label: 'Backwaters Wildlife Lodge',
          distanceKm: totalDistance,
          kmMarker: `Km ${totalDistance}`,
          estTime: '09:15 AM',
          status: 'Arrival at Riverside Sanctuary',
          roadCondition: 'Lakeside Unpaved Private Drive',
          trafficVerdict: 'arrival',
          elevationM: 705,
          x: 730,
          y: 100,
          speedLimit: '25 km/h',
          description: 'Check-in beside the tranquil Kabini backwaters. Prime morning boat safari window open.',
        },
      ];
    }

    // 4. Mumbai -> Alibaug or Lonavala
    if (oLower.includes('mumbai')) {
      const isAlibaug = dLower.includes('alibaug') || dLower.includes('mandwa') || dLower.includes('kashid');
      return [
        {
          id: 'wp-0',
          name: `${originClean} Departure Terminal`,
          role: 'origin',
          label: isAlibaug ? 'Bhaucha Dhakka Ro-Ro Pier' : 'Eastern Freeway Terminal',
          distanceKm: 0,
          kmMarker: 'Km 0',
          estTime: departureTime,
          status: 'Dawn Exit Gate',
          roadCondition: isAlibaug ? 'Marine Vessel Transit' : 'Elevated Expressway',
          trafficVerdict: 'optimal',
          elevationM: 10,
          x: 80,
          y: 240,
          speedLimit: isAlibaug ? '20 kts' : '80 km/h',
          description: isAlibaug
            ? 'Mandwa Ro-Ro vessel bypasses 3.5 hours of brutal NH66 road widening gridlock.'
            : 'Dawn departure beats Mumbai city traffic queues onto the expressway.',
        },
        {
          id: 'wp-1',
          name: isAlibaug ? 'Mandwa Maritime Terminal' : 'Khalapur Toll Plaza',
          role: 'choke_bypass',
          label: isAlibaug ? 'Coastal Arrival Pier' : 'Expressway Toll Clearance',
          distanceKm: Math.round(totalDistance * 0.35),
          kmMarker: `Km ${Math.round(totalDistance * 0.35)}`,
          estTime: '06:55 AM',
          status: 'Bottleneck Cleared',
          roadCondition: isAlibaug ? 'Coastal Double Lane' : '6-Lane Concrete Expressway',
          trafficVerdict: 'bypassed',
          elevationM: isAlibaug ? 15 : 120,
          x: 230,
          y: 215,
          speedLimit: isAlibaug ? '50 km/h' : '100 km/h',
          description: 'Clears the toll gate before weekend holiday convoys create 45-minute bottlenecks.',
        },
        {
          id: 'wp-2',
          name: isAlibaug ? 'Chondi & Kihim Coastal Bypass' : 'Khandala Bhor Ghat Scenic Viaduct',
          role: 'choke_bypass',
          label: isAlibaug ? 'Coconut Belt Arterial' : 'Ghats Ascent Viaduct',
          distanceKm: Math.round(totalDistance * 0.65),
          kmMarker: `Km ${Math.round(totalDistance * 0.65)}`,
          estTime: '07:40 AM',
          status: 'Scenic Elevation Transit',
          roadCondition: isAlibaug ? 'Palm Grove Road' : 'Ascending Mountain Pass',
          trafficVerdict: 'scenic',
          elevationM: isAlibaug ? 25 : 580,
          x: 390,
          y: 160,
          speedLimit: isAlibaug ? '45 km/h' : '60 km/h',
          description: isAlibaug
            ? 'Bypasses Alibaug town market traffic onto scenic quiet plantation lanes.'
            : 'Smooth ascent with sweeping Sahyadri valley views before tourist buses clog the ghats.',
        },
        {
          id: 'wp-3',
          name: isAlibaug ? 'Awas Beach Vista Pass' : 'Pawna Lake Watershed Corridor',
          role: 'scenic_oasis',
          label: isAlibaug ? 'Casuarina Shoreline' : 'Lakefront Foothill Road',
          distanceKm: Math.round(totalDistance * 0.85),
          kmMarker: `Km ${Math.round(totalDistance * 0.85)}`,
          estTime: '08:15 AM',
          status: 'Serene Pre-Arrival Stretch',
          roadCondition: 'Quiet Secondary Country Road',
          trafficVerdict: 'optimal',
          elevationM: isAlibaug ? 10 : 620,
          x: 560,
          y: 185,
          speedLimit: isAlibaug ? '40 km/h' : '45 km/h',
          description: 'Fresh cool breeze, zero commercial stores, tranquil approach path.',
        },
        {
          id: 'wp-4',
          name: `${destClean} Sanctuary`,
          role: 'destination',
          label: isAlibaug ? 'Private Coastal Estate' : 'Sahyadri Cliff Retreat',
          distanceKm: totalDistance,
          kmMarker: `Km ${totalDistance}`,
          estTime: '08:45 AM',
          status: 'Arrival at Retreat',
          roadCondition: 'Private Sanctuary Drive',
          trafficVerdict: 'arrival',
          elevationM: isAlibaug ? 15 : 670,
          x: 730,
          y: 100,
          speedLimit: '25 km/h',
          description: 'Check-in to secluded sanctuary. Morning breakfast on the veranda ready upon arrival.',
        },
      ];
    }

    // 5. Generic Procedural Generator for any custom Origin & Destination
    return [
      {
        id: 'wp-0',
        name: `${originClean} Departure Gate`,
        role: 'origin',
        label: 'Urban Exit Interchange',
        distanceKm: 0,
        kmMarker: 'Km 0',
        estTime: departureTime,
        status: 'Dawn Departure',
        roadCondition: 'Expressway Arterial',
        trafficVerdict: 'optimal',
        elevationM: 350,
        x: 80,
        y: 240,
        speedLimit: '80 km/h',
        description: `Early departure scheduled to beat standard rush hour congestion out of ${originClean}.`,
      },
      {
        id: 'wp-1',
        name: 'Corridor Express Sector',
        role: 'choke_bypass',
        label: 'Toll Corridor Clearance',
        distanceKm: Math.round(totalDistance * 0.3),
        kmMarker: `Km ${Math.round(totalDistance * 0.3)}`,
        estTime: '07:00 AM',
        status: 'Free Flow Cruising',
        roadCondition: 'Multi-Lane Divided Highway',
        trafficVerdict: 'optimal',
        elevationM: 420,
        x: 230,
        y: 215,
        speedLimit: '90 km/h',
        description: 'Cruising along optimal corridor before morning commercial vehicle density escalates.',
      },
      {
        id: 'wp-2',
        name: 'Regional Bottleneck Bypass',
        role: 'choke_bypass',
        label: `${corridorRoute.split('–')[0].split(',')[0]} Bypass`,
        distanceKm: Math.round(totalDistance * 0.65),
        kmMarker: `Km ${Math.round(totalDistance * 0.65)}`,
        estTime: '08:00 AM',
        status: 'Decisive Bypass Route Enforced',
        roadCondition: 'Ring Highway Bypass',
        trafficVerdict: 'bypassed',
        elevationM: 580,
        x: 390,
        y: 160,
        speedLimit: '75 km/h',
        description: 'Autonomous route avoids central urban bottlenecks, cutting down estimated transit time by ~30%.',
      },
      {
        id: 'wp-3',
        name: `${destClean} Scenic Threshold`,
        role: 'scenic_oasis',
        label: 'Landscape & Terrain Transition',
        distanceKm: Math.round(totalDistance * 0.85),
        kmMarker: `Km ${Math.round(totalDistance * 0.85)}`,
        estTime: '08:45 AM',
        status: 'Scenic Vista Leg',
        roadCondition: 'Undulating Scenic Highway',
        trafficVerdict: 'scenic',
        elevationM: 760,
        x: 560,
        y: 185,
        speedLimit: '55 km/h',
        description: `Transitioning into ${destClean} local terrain. Quiet roads, verified scenic vista points.`,
      },
      {
        id: 'wp-4',
        name: `${destClean} Sanctuary`,
        role: 'destination',
        label: 'Arrival & Retreat Check-in',
        distanceKm: totalDistance,
        kmMarker: `Km ${totalDistance}`,
        estTime: '09:20 AM',
        status: 'Arrival Complete',
        roadCondition: 'Secluded Sanctuary Access',
        trafficVerdict: 'arrival',
        elevationM: 920,
        x: 730,
        y: 100,
        speedLimit: '30 km/h',
        description: `Smooth arrival at ${destClean}. Total transit completed inside optimal traffic window.`,
      },
    ];
  }, [origin, destination, departureTime, totalDistance, corridorRoute, originClean, destClean]);

  // Selected or active waypoint
  const activeWaypoint = useMemo(() => {
    return waypoints.find((w) => w.id === activeWaypointId) || waypoints[2];
  }, [waypoints, activeWaypointId]);

  // Update car position along the path as transitProgress updates
  useEffect(() => {
    if (pathRef.current) {
      try {
        const pathLength = pathRef.current.getTotalLength();
        const pt = pathRef.current.getPointAtLength(transitProgress * pathLength);
        setCarPosition({ x: pt.x, y: pt.y });
      } catch {
        // Fallback interpolation if SVG getPointAtLength fails
        const p = transitProgress;
        const x = 80 + (730 - 80) * p;
        const y = 240 + (100 - 240) * p - Math.sin(p * Math.PI) * 60;
        setCarPosition({ x, y });
      }
    }
  }, [transitProgress]);

  // Animation loop when playing transit simulation
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTimestamp = performance.now();
    const animate = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setTransitProgress((prev) => {
        const next = prev + (delta / 1000) * 0.12; // Complete transit in ~8 seconds
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (transitProgress >= 1) {
      setTransitProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTransitProgress(0);
  };

  // Find nearest waypoint based on progress
  const currentLegWaypoint = useMemo(() => {
    const kmCovered = transitProgress * totalDistance;
    let closest = waypoints[0];
    for (const wp of waypoints) {
      if (kmCovered >= wp.distanceKm) {
        closest = wp;
      }
    }
    return closest;
  }, [transitProgress, totalDistance, waypoints]);

  // SVG Path definitions
  // Primary Decisive Recommended Corridor (Smooth bezier bypass)
  const recommendedPathD = 'M 80,240 C 150,240 170,215 230,215 C 310,215 330,160 390,160 C 470,160 500,185 560,185 C 630,185 660,100 730,100';
  
  // Standard Congested Route (Direct Highway passes through heavy bottlenecks)
  const comparisonPathD = 'M 80,240 C 220,300 340,280 460,250 C 580,220 660,160 730,100';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#865302]/10 text-[#865302] border border-[#C88A3C]/30 flex items-center justify-center">
            <Route className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#1E1B19] tracking-tight">
                Decisive Route Topography & Corridor Path
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#865302] border border-[#E3D5C5]">
                Interactive SVG Map
              </span>
            </div>
            <p className="text-xs text-[#837466]">
              {originClean} ➔ {destClean} · {totalDistance} km autonomous navigation corridor
            </p>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Recommended vs Comparison Route Mode */}
          <div className="flex items-center bg-[#FAF5EE] p-0.5 rounded-xl border border-[#DECFC0] text-xs">
            <button
              type="button"
              onClick={() => setRouteMode('recommended')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                routeMode === 'recommended'
                  ? 'bg-white text-[#865302] shadow-2xs border border-[#DECFC0]/80'
                  : 'text-[#837466] hover:text-[#1E1B19]'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-[#C88A3C]" />
              <span>Decisive Corridor</span>
            </button>
            <button
              type="button"
              onClick={() => setRouteMode('comparison')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                routeMode === 'comparison'
                  ? 'bg-white text-[#865302] shadow-2xs border border-[#DECFC0]/80'
                  : 'text-[#837466] hover:text-[#1E1B19]'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Compare Bottleneck Route</span>
            </button>
          </div>

          {/* Toggle Layers */}
          <button
            type="button"
            onClick={() => setShowElevationProfile(!showElevationProfile)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showElevationProfile
                ? 'bg-[#865302]/10 border-[#C88A3C]/40 text-[#865302] font-semibold'
                : 'bg-white border-[#DECFC0] text-[#655D59] hover:bg-[#FAF5EE]'
            }`}
          >
            <Mountain className="w-3 h-3" />
            <span>Elevation</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTopoContours(!showTopoContours)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showTopoContours
                ? 'bg-[#865302]/10 border-[#C88A3C]/40 text-[#865302] font-semibold'
                : 'bg-white border-[#DECFC0] text-[#655D59] hover:bg-[#FAF5EE]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Contours</span>
          </button>
        </div>
      </div>

      {/* Main SVG Visualization Canvas Container */}
      <div className="relative rounded-2xl border border-[#DECFC0] bg-gradient-to-b from-[#FAF6F0] via-[#FAF4ED] to-[#F5EBE1] overflow-hidden shadow-inner select-none">
        
        {/* Subtle Map Graticule Lat/Long Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-2 left-3 text-[9px] font-data text-[#A39281]">12°58′ N, 77°35′ E · Hub Origin</div>
          <div className="absolute bottom-2 right-3 text-[9px] font-data text-[#A39281]">12°56′ N, 75°47′ E · Sanctuary Ridge</div>
          <div className="absolute top-2 right-12 text-[9px] font-data text-[#A39281]">SCALE: 50 KM ━━━ 100 KM</div>
        </div>

        {/* Compass Rose in top right */}
        <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs border border-[#DECFC0] flex items-center justify-center text-[#865302] shadow-2xs">
          <Compass className="w-4 h-4" />
        </div>

        {/* Legend / Status Pill */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-[#DECFC0] text-[11px] font-semibold text-[#1E1B19] shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#865302]" />
            <span>Active Corridor: {corridorRoute.split('–')[0]}</span>
          </div>
          {seasonalDynamics && (
            <div className="hidden sm:flex px-2 py-0.5 rounded-lg bg-[#FAF2EE]/90 backdrop-blur-xs border border-[#E3D5C5] text-[10px] font-medium text-[#865302]">
              Rush factor: {seasonalDynamics.rush_factor}
            </div>
          )}
        </div>

        {/* The SVG Visualization Canvas */}
        <svg
          viewBox="0 0 810 330"
          className="w-full h-auto min-h-[260px] sm:min-h-[300px] overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient for recommended route line */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#865302" />
              <stop offset="40%" stopColor="#C88A3C" />
              <stop offset="75%" stopColor="#865302" />
              <stop offset="100%" stopColor="#2E6B4F" />
            </linearGradient>

            {/* Gradient for glow underlay */}
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C88A3C" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#E0A96D" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
            </linearGradient>

            {/* Congested route gradient */}
            <linearGradient id="congestedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="45%" stopColor="#DC2626" />
              <stop offset="70%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </linearGradient>

            {/* Filter for glow */}
            <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#865302" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Graticule Grid Lines */}
          <g stroke="#EADBCE" strokeWidth="0.8" strokeDasharray="3 4">
            <line x1="80" y1="20" x2="80" y2="310" />
            <line x1="230" y1="20" x2="230" y2="310" />
            <line x1="390" y1="20" x2="390" y2="310" />
            <line x1="560" y1="20" x2="560" y2="310" />
            <line x1="730" y1="20" x2="730" y2="310" />
            <line x1="30" y1="100" x2="780" y2="100" />
            <line x1="30" y1="180" x2="780" y2="180" />
            <line x1="30" y1="240" x2="780" y2="240" />
          </g>

          {/* Topographic Contour Rings (if enabled) */}
          {showTopoContours && (
            <g fill="none" stroke="#C88A3C" strokeOpacity="0.16" strokeWidth="1.2">
              {/* Foothill Contours around midway waypoint */}
              <ellipse cx="390" cy="160" rx="95" ry="50" strokeDasharray="4 3" />
              <ellipse cx="390" cy="160" rx="135" ry="70" strokeDasharray="5 4" strokeOpacity="0.1" />

              {/* Highland Mountain Sanctuary Contours */}
              <ellipse cx="730" cy="100" rx="75" ry="45" strokeDasharray="3 3" />
              <ellipse cx="730" cy="100" rx="120" ry="70" strokeDasharray="4 4" strokeOpacity="0.12" />
              <ellipse cx="730" cy="100" rx="160" ry="95" strokeDasharray="5 5" strokeOpacity="0.08" />

              {/* Valley depression curves */}
              <path d="M 120,280 Q 240,250 340,285 T 520,290" strokeOpacity="0.1" strokeDasharray="6 4" />
              <path d="M 450,130 Q 560,90 680,120" strokeOpacity="0.14" strokeDasharray="4 4" />
            </g>
          )}

          {/* Alternative / Congested Standard Highway (Comparison Mode) */}
          {routeMode === 'comparison' && (
            <g>
              {/* Congested route path */}
              <path
                d={comparisonPathD}
                fill="none"
                stroke="url(#congestedGradient)"
                strokeWidth="4"
                strokeDasharray="6 4"
                strokeLinecap="round"
                className="transition-all duration-300"
              />

              {/* Congestion Hotspot Marker along comparison route */}
              <g transform="translate(460, 250)">
                <circle r="16" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" className="animate-ping opacity-75" />
                <circle r="12" fill="#DC2626" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">!</text>
                
                {/* Hotspot callout label */}
                <rect x="-90" y="18" width="180" height="26" rx="6" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1" />
                <text x="0" y="35" textAnchor="middle" fill="#FEE2E2" fontSize="9.5" fontWeight="bold">
                  Bottleneck: +45m Peak Delay
                </text>
              </g>
            </g>
          )}

          {/* Glowing underlay for active recommended path */}
          <path
            d={recommendedPathD}
            fill="none"
            stroke="url(#routeGlow)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Primary Recommended Route Path */}
          <path
            ref={pathRef}
            d={recommendedPathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#routeShadow)"
          />

          {/* Animated Flow Dash Effect */}
          <path
            d={recommendedPathD}
            fill="none"
            stroke="#FAF2EE"
            strokeWidth="1.8"
            strokeDasharray="6 14"
            strokeLinecap="round"
            className="opacity-60"
            style={{
              animation: 'dash 20s linear infinite',
            }}
          />

          {/* Waypoint Nodes along the path */}
          {waypoints.map((wp) => {
            const isHovered = hoveredWaypointId === wp.id;
            const isActive = activeWaypointId === wp.id;
            const isOrigin = wp.role === 'origin';
            const isDestination = wp.role === 'destination';

            return (
              <g
                key={wp.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => setActiveWaypointId(wp.id)}
                onMouseEnter={() => setHoveredWaypointId(wp.id)}
                onMouseLeave={() => setHoveredWaypointId(null)}
              >
                {/* Active / Hover Pulse Halo */}
                {(isActive || isHovered) && (
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={isOrigin || isDestination ? 24 : 20}
                    fill={isDestination ? '#10B981' : '#C88A3C'}
                    fillOpacity="0.2"
                    className="animate-pulse"
                  />
                )}

                {/* Outer Node Border Ring */}
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isOrigin || isDestination ? 14 : 10}
                  fill="#FFFFFF"
                  stroke={
                    isDestination
                      ? '#15803D'
                      : isOrigin
                      ? '#865302'
                      : wp.trafficVerdict === 'bypassed'
                      ? '#C88A3C'
                      : '#655D59'
                  }
                  strokeWidth={isActive ? 3 : 2}
                  filter="url(#routeShadow)"
                />

                {/* Inner Core */}
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isOrigin || isDestination ? 7 : 5}
                  fill={
                    isDestination
                      ? '#16A34A'
                      : isOrigin
                      ? '#865302'
                      : wp.trafficVerdict === 'bypassed'
                      ? '#C88A3C'
                      : '#A39281'
                  }
                />

                {/* Waypoint Label Badge */}
                <g transform={`translate(${wp.x}, ${wp.y + (wp.y > 180 ? -22 : 24)})`}>
                  <rect
                    x={-(wp.label.length * 3.3 + 12)}
                    y="-11"
                    width={wp.label.length * 6.6 + 24}
                    height="20"
                    rx="5"
                    fill={isActive ? '#1E1B19' : '#FFFFFF'}
                    stroke={isActive ? '#865302' : '#DECFC0'}
                    strokeWidth={isActive ? 1.5 : 1}
                    filter="url(#routeShadow)"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isActive ? '#FAF2EE' : '#1E1B19'}
                    fontSize="9.5"
                    fontWeight={isActive ? 'bold' : '600'}
                    fontFamily="system-ui, sans-serif"
                  >
                    {wp.label}
                  </text>
                </g>

                {/* Km Distance Marker pill */}
                <text
                  x={wp.x}
                  y={wp.y + (wp.y > 180 ? -38 : 39)}
                  textAnchor="middle"
                  fill="#837466"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {wp.kmMarker}
                </text>
              </g>
            );
          })}

          {/* Interactive Simulated Transit Vehicle Marker */}
          <g
            transform={`translate(${carPosition.x}, ${carPosition.y})`}
            className="pointer-events-none transition-transform duration-75"
          >
            {/* Glowing radar ping */}
            <circle r="16" fill="#C88A3C" fillOpacity="0.25" className="animate-ping" />
            {/* Vehicle Base */}
            <circle r="11" fill="#1E1B19" stroke="#F59E0B" strokeWidth="2.5" filter="url(#routeShadow)" />
            {/* Vehicle Navigation Arrow Icon */}
            <polygon
              points="0,-5 5,5 0,3 -5,5"
              fill="#FDE68A"
              transform="rotate(35)"
            />
          </g>
        </svg>

        {/* Floating Mini Legend within Map Canvas */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2">
          <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#DECFC0] shadow-2xs text-[10px] text-[#655D59] flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#865302]" />
              <span>Origin</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C88A3C]" />
              <span>Choke Bypass</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span>Sanctuary</span>
            </span>
          </div>

          <span className="text-[10px] text-[#837466] font-medium hidden sm:inline">
            Click any node on the path to inspect corridor details
          </span>
        </div>
      </div>

      {/* Transit Simulation Scrubber Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E3D5C5] shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-[#865302] hover:bg-[#683F00] text-white transition-colors shadow-2xs flex items-center gap-1 font-semibold text-[11px]"
              title={isPlaying ? 'Pause transit simulation' : 'Play transit simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Simulate Transit'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-[#FAF5EE] hover:bg-[#F2E8DC] text-[#865302] border border-[#DECFC0] transition-colors"
              title="Reset transit scrubber to start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="text-[#1E1B19] font-medium text-xs">
              Transit Progress:{' '}
              <span className="font-bold font-data text-[#865302]">
                {Math.round(transitProgress * 100)}%
              </span>{' '}
              ({Math.round(transitProgress * totalDistance)} km / {totalDistance} km)
            </span>
          </div>

          <div className="text-[11px] text-[#837466] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#C88A3C]" />
            <span>Currently traversing:</span>
            <span className="font-semibold text-[#1E1B19]">{currentLegWaypoint.name}</span>
          </div>
        </div>

        {/* Interactive Scrub Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-data text-[#837466] w-12">{departureTime}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={transitProgress}
            onChange={(e) => {
              setIsPlaying(false);
              setTransitProgress(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-[#E8DDD2] rounded-lg appearance-none cursor-pointer accent-[#865302]"
          />
          <span className="text-[10px] font-data text-[#837466] w-16 text-right">
            {waypoints[waypoints.length - 1].estTime}
          </span>
        </div>
      </div>

      {/* Selected Waypoint Detail Card */}
      {activeWaypoint && (
        <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#DECFC0] shadow-2xs space-y-2.5 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeWaypoint.role === 'destination'
                    ? 'bg-emerald-600'
                    : activeWaypoint.role === 'origin'
                    ? 'bg-[#865302]'
                    : activeWaypoint.trafficVerdict === 'bypassed'
                    ? 'bg-amber-600'
                    : 'bg-[#C88A3C]'
                }`}
              />
              <h5 className="text-sm font-bold text-[#1E1B19]">
                {activeWaypoint.name}
              </h5>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#865302] border border-[#DECFC0] font-data">
                {activeWaypoint.kmMarker}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#837466]">Passage Window:</span>
              <span className="font-bold text-[#1E1B19] font-data">
                {activeWaypoint.estTime}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  activeWaypoint.trafficVerdict === 'bypassed'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : activeWaypoint.trafficVerdict === 'arrival'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-stone-100 text-stone-800 border-stone-300'
                }`}
              >
                {activeWaypoint.status}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#514538] leading-relaxed">
            {activeWaypoint.description}
          </p>

          <div className="pt-2 border-t border-[#DECFC0]/70 flex flex-wrap items-center justify-between gap-3 text-xs text-[#837466]">
            <div className="flex items-center gap-3">
              <span>Road Type: <strong className="text-[#1E1B19]">{activeWaypoint.roadCondition}</strong></span>
              <span>Speed Flow: <strong className="text-[#1E1B19] font-data">{activeWaypoint.speedLimit}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#865302] font-semibold">
              <Mountain className="w-3.5 h-3.5 text-[#C88A3C]" />
              <span>Elevation: {activeWaypoint.elevationM} meters</span>
            </div>
          </div>
        </div>
      )}

      {/* Elevation & Topographic Profile Mini-Strip (if toggled) */}
      {showElevationProfile && (
        <div className="p-3 rounded-xl bg-white border border-[#E3D5C5] shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#865302]">
            <div className="flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-[#C88A3C]" />
              <span>Corridor Elevation Profile & Gradient Ascent</span>
            </div>
            <span className="text-[#837466] text-[10px] font-normal">
              Delta: {waypoints[waypoints.length - 1].elevationM - waypoints[0].elevationM > 0 ? '+' : ''}
              {waypoints[waypoints.length - 1].elevationM - waypoints[0].elevationM}m climb
            </span>
          </div>

          {/* Elevation Bar Chart Visualization */}
          <div className="h-10 w-full flex items-end gap-1.5 pt-2">
            {waypoints.map((wp, idx) => {
              const maxElevation = Math.max(...waypoints.map((w) => w.elevationM), 1200);
              const heightPct = Math.max(25, Math.round((wp.elevationM / maxElevation) * 100));
              const isCurrent = activeWaypointId === wp.id;

              return (
                <div
                  key={wp.id}
                  onClick={() => setActiveWaypointId(wp.id)}
                  className="flex-1 flex flex-col items-center group cursor-pointer"
                  title={`${wp.name}: ${wp.elevationM}m`}
                >
                  <div className="w-full flex justify-center text-[8.5px] font-data text-[#837466] group-hover:text-[#1E1B19] transition-colors mb-0.5">
                    {wp.elevationM}m
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#865302]'
                        : 'bg-gradient-to-t from-[#DECFC0] to-[#C88A3C]/70 group-hover:to-[#865302]/70'
                    }`}
                  />
                  <div className="text-[8px] font-semibold text-[#837466] truncate max-w-[65px] mt-0.5 text-center">
                    {wp.kmMarker}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
