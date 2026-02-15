/**
 * Beautiful World Map using react-simple-maps
 * Clean, minimal SVG-based choropleth visualization
 * Shows visitor density by country with smooth interactions
 */
import { useState, useMemo, memo, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { useMatomoCountries, useMatomoRealtime, useMatomoLiveCounters } from '@/hooks/useMatomoData';
import { Globe, Users, Eye, Clock, MapPin, ChevronDown } from 'lucide-react';

// Natural Earth TopoJSON - Clean country boundaries (hosted CDN)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Country flag emoji helper
const getCountryFlag = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
};

// Format number with locale string
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

// UDSM Design System Colors - Light Blue Theme
const colorPalette = {
  noData: '#cbd5e1',       // Light gray for all countries
  stroke: '#94a3b8',       // Blue-gray stroke
  hover: '#b8c5d6',        // Light blue-gray hover
  highlight: '#235dcb',    // UDSM Blue highlight
  base: '#235dcb',         // UDSM Blue (Primary)
  ocean: '#e8f4fd',        // Light blue ocean background
  gradient: [
    '#f0f9ff',  // Lightest blue
    '#e0f2fe',
    '#bae6fd',
    '#7dd3fc',
    '#38bdf8',
    '#0ea5e9',
    '#0284c7',
    '#0369a1',
    '#1a5fb4',
    '#235dcb',  // UDSM Blue (most visitors)
  ],
};

// Country coordinates for markers
const countryCoordinates: Record<string, [number, number]> = {
  us: [-95.7, 37.1], gb: [-1.17, 52.35], de: [10.45, 51.16], fr: [2.21, 46.23],
  ca: [-106.35, 56.13], au: [133.77, -25.27], jp: [138.25, 36.2], cn: [104.19, 35.86],
  in: [78.96, 20.59], br: [-51.92, -14.23], mx: [-102.55, 23.63], za: [22.94, -30.56],
  ng: [8.67, 9.08], ke: [37.91, -0.02], tz: [34.89, -6.37], ug: [32.29, 1.37],
  gh: [-1.02, 7.95], eg: [30.8, 26.82], sa: [45.08, 23.88], ru: [105.32, 61.52],
  it: [12.57, 41.87], es: [-3.75, 40.46], nl: [5.29, 52.13], se: [18.64, 60.13],
  no: [8.47, 60.47], pl: [19.15, 51.92], ch: [8.23, 46.82], be: [4.47, 50.5],
  at: [14.55, 47.52], dk: [9.5, 56.26], sg: [103.82, 1.35], my: [101.97, 4.21],
  th: [100.99, 15.87], ph: [121.77, 12.88], id: [113.92, -0.79], vn: [108.28, 14.06],
  pk: [69.35, 30.38], bd: [90.36, 23.68], nz: [174.89, -40.9], ar: [-63.62, -38.42],
  cl: [-71.54, -35.68], co: [-74.3, 4.57], pe: [-75.02, -9.19], tr: [35.24, 38.96],
  ae: [53.85, 23.42], rw: [29.87, -1.94], et: [40.49, 9.15], mw: [34.3, -13.25],
  zm: [27.85, -13.13], zw: [29.15, -19.02], bw: [24.68, -22.33], na: [18.49, -22.96],
  mz: [35.53, -18.66], ao: [17.87, -11.2], cd: [21.76, -4.04], cm: [12.35, 7.37],
  sn: [-14.45, 14.5], ci: [-5.55, 7.54], ml: [-4, 17.57], bf: [-1.56, 12.24],
  ne: [8.08, 17.61], td: [18.73, 15.45], sd: [30.22, 12.86], ly: [17.23, 26.34],
  dz: [1.66, 28.03], ma: [-7.09, 31.79], tn: [9.54, 33.89],
};

// Country name mappings from ISO numeric to Matomo codes
const countryIdToCode: Record<string, string> = {
  '840': 'us', '826': 'gb', '276': 'de', '250': 'fr', '124': 'ca', '036': 'au',
  '392': 'jp', '156': 'cn', '356': 'in', '076': 'br', '484': 'mx', '710': 'za',
  '566': 'ng', '404': 'ke', '834': 'tz', '800': 'ug', '288': 'gh', '818': 'eg',
  '682': 'sa', '643': 'ru', '380': 'it', '724': 'es', '528': 'nl', '752': 'se',
  '578': 'no', '616': 'pl', '756': 'ch', '056': 'be', '040': 'at', '208': 'dk',
  '702': 'sg', '458': 'my', '764': 'th', '608': 'ph', '360': 'id', '704': 'vn',
  '586': 'pk', '050': 'bd', '554': 'nz', '032': 'ar', '152': 'cl', '170': 'co',
  '604': 'pe', '376': 'il', '792': 'tr', '804': 'ua', '642': 'ro', '203': 'cz',
  '300': 'gr', '620': 'pt', '348': 'hu', '372': 'ie', '246': 'fi', '442': 'lu',
  '191': 'hr', '705': 'si', '703': 'sk', '100': 'bg', '233': 'ee', '428': 'lv',
  '440': 'lt', '499': 'me', '688': 'rs', '008': 'al', '807': 'mk', '070': 'ba',
  '112': 'by', '498': 'md', '268': 'ge', '051': 'am', '031': 'az', '398': 'kz',
  '860': 'uz', '762': 'tj', '417': 'kg', '795': 'tm', '496': 'mn', '410': 'kr',
  '408': 'kp', '158': 'tw', '344': 'hk', '446': 'mo', '144': 'lk', '524': 'np',
  '064': 'bt', '462': 'mv', '004': 'af', '364': 'ir', '368': 'iq', '760': 'sy',
  '400': 'jo', '422': 'lb', '275': 'ps', '784': 'ae', '414': 'kw', '048': 'bh',
  '634': 'qa', '512': 'om', '887': 'ye', '012': 'dz', '504': 'ma', '788': 'tn',
  '434': 'ly', '729': 'sd', '728': 'ss', '231': 'et', '232': 'er', '262': 'dj',
  '706': 'so', '646': 'rw', '108': 'bi', '180': 'cd', '178': 'cg', '266': 'ga',
  '226': 'gq', '120': 'cm', '140': 'cf', '148': 'td', '562': 'ne', '466': 'ml',
  '854': 'bf', '686': 'sn', '270': 'gm', '624': 'gw', '384': 'ci', '430': 'lr',
  '694': 'sl', '324': 'gn', '768': 'tg', '204': 'bj', '508': 'mz', '894': 'zm',
  '716': 'zw', '072': 'bw', '516': 'na', '024': 'ao', '454': 'mw', '450': 'mg',
  '174': 'km', '480': 'mu', '690': 'sc', '858': 'uy', '600': 'py', '068': 'bo',
  '218': 'ec', '862': 've', '328': 'gy', '740': 'sr', '254': 'gf', '591': 'pa',
  '188': 'cr', '558': 'ni', '340': 'hn', '222': 'sv', '320': 'gt', '084': 'bz',
  '192': 'cu', '332': 'hi', '214': 'do', '630': 'pr', '388': 'jm', '044': 'bs',
  '052': 'bb', '780': 'tt', '308': 'gd', '670': 'vc', '662': 'lc', '212': 'dm',
  '028': 'ag', '659': 'kn', '352': 'is', '234': 'fo', '304': 'gl',
};

interface TooltipData {
  name: string;
  countryCode: string;
  visits: number;
  visitors: number;
  actions: number;
  x: number;
  y: number;
}

// Time period options for the dropdown
type TimePeriod = 'live' | 'today' | 'week' | 'month' | 'year';

const periodOptions: { value: TimePeriod; label: string; period: string; date: string }[] = [
  { value: 'live', label: 'Live (30m)', period: 'day', date: 'today' },
  { value: 'today', label: 'Today', period: 'day', date: 'today' },
  { value: 'week', label: 'This Week', period: 'week', date: 'today' },
  { value: 'month', label: 'This Month', period: 'month', date: 'today' },
  { value: 'year', label: 'All Time', period: 'range', date: '2020-01-01,today' },
];

const WorldMap = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('live');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Get the period config
  const periodConfig = periodOptions.find(p => p.value === selectedPeriod) || periodOptions[0];
  
  // Fetch real-time visitors data (for 'live' mode)
  const { data: realtimeData } = useMatomoRealtime();
  
  // Fetch live counters (active visitors in last 30 minutes)
  const { data: liveCounters } = useMatomoLiveCounters(30);
  
  // Fetch country data based on selected period
  const { data: periodCountries = [], isLoading, error } = useMatomoCountries(
    periodConfig.period,
    periodConfig.date
  );
  
  // For 'live' mode, filter visitors to only those active in last 30 minutes
  const liveCountries = useMemo(() => {
    if (selectedPeriod !== 'live' || !realtimeData?.visitors) return [];
    
    // Get current timestamp
    const now = Math.floor(Date.now() / 1000);
    const thirtyMinutesAgo = now - (30 * 60); // 30 minutes in seconds
    
    // Filter to only visitors active in last 30 minutes
    const activeVisitors = realtimeData.visitors.filter(visitor => 
      visitor.lastActionTimestamp && visitor.lastActionTimestamp >= thirtyMinutesAgo
    );
    
    // Group active visitors by country
    const countryMap = new Map<string, { label: string; code: string; nb_visits: number; nb_uniq_visitors: number; nb_actions: number }>();
    
    activeVisitors.forEach(visitor => {
      const code = visitor.countryCode?.toLowerCase();
      if (code) {
        const existing = countryMap.get(code);
        if (existing) {
          existing.nb_visits += 1;
          existing.nb_uniq_visitors += 1;
          existing.nb_actions += visitor.actionDetails?.length || 1;
        } else {
          countryMap.set(code, {
            label: visitor.country || code.toUpperCase(),
            code: code,
            nb_visits: 1,
            nb_uniq_visitors: 1,
            nb_actions: visitor.actionDetails?.length || 1,
          });
        }
      }
    });
    
    return Array.from(countryMap.values());
  }, [selectedPeriod, realtimeData?.visitors]);
  
  // Use live data or period data based on selection
  const countries = selectedPeriod === 'live' ? liveCountries : periodCountries;
  
  // Get live stats for display
  const liveStats = useMemo(() => {
    if (!liveCounters || !Array.isArray(liveCounters) || liveCounters.length === 0) {
      return { visitors: 0, visits: 0, actions: 0 };
    }
    const counters = liveCounters[0];
    return {
      visitors: counters.visitors || 0,
      visits: counters.visits || 0,
      actions: counters.actions || 0,
    };
  }, [liveCounters]);
  
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Build country data lookup by ISO numeric code and by alpha-2 code
  const countryDataMap = useMemo(() => {
    const map = new Map<string, { visits: number; visitors: number; actions: number; label: string; code: string }>();
    
    countries.forEach(country => {
      const code = country.code?.toLowerCase() || '';
      if (code) {
        // Store by alpha-2 code
        map.set(code, {
          visits: country.nb_visits || 0,
          visitors: country.nb_uniq_visitors || 0,
          actions: country.nb_actions || 0,
          label: country.label || '',
          code: code,
        });
      }
    });
    
    return map;
  }, [countries]);

  // Calculate max visits for color scale
  const maxVisits = useMemo(() => {
    if (countries.length === 0) return 100;
    return Math.max(...countries.map(c => c.nb_visits || 0), 1);
  }, [countries]);

  // Marker locations from countries with visits - Real-time data only
  const markerLocations = useMemo(() => {
    const locations = countries
      .filter(c => c.code && countryCoordinates[c.code.toLowerCase()] && c.nb_visits > 0)
      .map(c => ({
        code: c.code!.toLowerCase(),
        coordinates: countryCoordinates[c.code!.toLowerCase()],
        visits: c.nb_visits || 0,
        label: c.label,
      }))
      .slice(0, 30);
    
    // Return actual data only - no fallback demo data
    return locations;
  }, [countries]);

  // Auto-rotate through countries
  useEffect(() => {
    if (markerLocations.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % markerLocations.length);
    }, 3000); // Rotate every 3 seconds
    
    return () => clearInterval(interval);
  }, [markerLocations.length]);

  // Color scale function
  const getCountryColor = (visits: number) => {
    if (visits === 0) return colorPalette.noData;
    
    const scale = scaleLinear<string>()
      .domain([0, maxVisits * 0.05, maxVisits * 0.15, maxVisits * 0.3, maxVisits * 0.5, maxVisits])
      .range([colorPalette.gradient[1], colorPalette.gradient[3], colorPalette.gradient[5], colorPalette.gradient[7], colorPalette.gradient[8], colorPalette.gradient[9]])
      .clamp(true);
    
    return scale(visits);
  };

  // Get country data from geography
  const getCountryData = (geo: any) => {
    const numericId = geo.id;
    const alpha2 = countryIdToCode[numericId];
    if (alpha2) {
      return countryDataMap.get(alpha2);
    }
    return null;
  };

  // Handle mouse events
  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    const data = getCountryData(geo);
    const countryName = geo.properties?.name || 'Unknown';
    
    if (data && data.visits > 0) {
      setTooltipData({
        name: data.label || countryName,
        countryCode: data.code,
        visits: data.visits,
        visitors: data.visitors,
        actions: data.actions,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltipData) {
      setTooltipData(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.5, 1));
  const handleReset = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-[#e8f4fd] rounded-xl border border-blue-100">
        <div className="text-center text-slate-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Unable to load map data</p>
          <p className="text-xs mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#e8f4fd] rounded-xl overflow-hidden border border-blue-100">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[#235dcb] border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: '3px' }} />
            <p className="text-sm text-slate-600">Loading map data...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="h-[400px] relative overflow-hidden" onMouseMove={handleMouseMove}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [0, 25],
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colorPalette.ocean,
            touchAction: 'none',
          }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: z }) => {
              setCenter(coordinates as [number, number]);
              setZoom(z);
            }}
            minZoom={1}
            maxZoom={8}
            translateExtent={[[-200, -100], [1200, 700]]}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const data = getCountryData(geo);
                  const visits = data?.visits || 0;
                  const isHovered = tooltipData?.countryCode === data?.code;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isHovered ? colorPalette.hover : colorPalette.noData}
                      stroke={isHovered && visits > 0 ? colorPalette.highlight : colorPalette.stroke}
                      strokeWidth={isHovered && visits > 0 ? 0.8 : 0.3}
                      style={{
                        default: { 
                          outline: 'none', 
                          transition: 'all 0.25s ease-out',
                        },
                        hover: { 
                          outline: 'none', 
                          cursor: visits > 0 ? 'pointer' : 'default',
                          fill: visits > 0 ? colorPalette.hover : colorPalette.noData,
                          stroke: visits > 0 ? colorPalette.highlight : colorPalette.stroke,
                          strokeWidth: visits > 0 ? 0.8 : 0.3,
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={(event) => handleMouseEnter(geo, event)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })
              }
            </Geographies>

            {/* Live visitor dots - Yellow only */}
            {markerLocations.length > 0 && markerLocations.map((location, idx) => {
              const isActive = idx === activeIndex;
              const isHovered = tooltipData?.countryCode === location.code;
              // Larger dots (6-12px) for better visibility
              const dotSize = (isActive || isHovered) ? 10 : Math.max(6, Math.min(12, (location.visits / maxVisits) * 12));
              
              return (
                <Marker key={`${location.code}-${idx}`} coordinates={location.coordinates}>
                  {/* Main dot - yellow/gold for all */}
                  <circle
                    r={dotSize}
                    fill="#d4a017"
                    fillOpacity={1}
                    stroke="#235dcb"
                    strokeWidth={(isActive || isHovered) ? 3 : 2}
                    className={(isActive || isHovered) ? 'animate-pulse' : ''}
                  />
                  {/* Pulse effect for active dot */}
                  {(isActive || isHovered) && (
                    <>
                      <circle
                        r={dotSize * 2.5}
                        fill="none"
                        stroke="#d4a017"
                        strokeWidth={1.5}
                        opacity={0.5}
                        className="animate-ping"
                      />
                      <circle
                        r={dotSize * 1.5}
                        fill="#d4a017"
                        opacity={0.3}
                      />
                    </>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#235dcb] transition-all hover:scale-105"
          title="Zoom in"
        >
          <span className="text-lg font-medium leading-none">+</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#235dcb] transition-all hover:scale-105"
          title="Zoom out"
        >
          <span className="text-lg font-medium leading-none">−</span>
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#235dcb] transition-all hover:scale-105"
          title="Reset view"
        >
          <Globe className="w-4 h-4" />
        </button>
      </div>

      {/* Color Legend - Compact */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-lg border border-gray-100 z-10">
        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {selectedPeriod === 'live' ? 'Live Activity' : 'Visitor Activity'}
        </p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-[#d4a017] border-2 border-[#235dcb] ${selectedPeriod === 'live' ? 'animate-pulse' : ''}`}></div>
          <span className="text-[10px] text-gray-600">
            {selectedPeriod === 'live' ? 'Active readers' : `Readers (${periodOptions.find(p => p.value === selectedPeriod)?.label})`}
          </span>
        </div>
      </div>

      {/* Stats Badge - Shows live or period stats */}
      {(selectedPeriod === 'live' || countries.length > 0) && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-100 z-10">
          {selectedPeriod === 'live' ? (
            // Live mode: Show real-time counters
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-600">{liveStats.visitors}</span>
                <span className="text-[9px] text-gray-500">Active</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-[#3b82f6]" />
                <span className="text-xs font-bold text-[#3b82f6]">{liveStats.visits}</span>
                <span className="text-[9px] text-gray-500">Visits (30m)</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#235dcb]" />
                <span className="text-xs font-bold text-[#235dcb]">{liveStats.actions}</span>
                <span className="text-[9px] text-gray-500">Actions</span>
              </div>
            </div>
          ) : (
            // Period mode: Show country stats
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#235dcb]" />
                <span className="text-xs font-bold text-[#235dcb]">{countries.length}</span>
                <span className="text-[9px] text-gray-500">countries</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-[#3b82f6]" />
                <span className="text-xs font-bold text-[#3b82f6]">
                  {formatNumber(countries.reduce((sum, c) => sum + (c.nb_visits || 0), 0))}
                </span>
                <span className="text-[9px] text-gray-500">visits</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time Period Dropdown */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 hover:border-blue-300 transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-[#235dcb]" />
            <span className="text-xs font-semibold text-[#235dcb]">
              {periodOptions.find(p => p.value === selectedPeriod)?.label}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            {selectedPeriod === 'live' && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-30">
              {periodOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedPeriod(option.value);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center gap-2
                    ${selectedPeriod === option.value 
                      ? 'bg-blue-50 text-[#235dcb]' 
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {option.value === 'live' && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                  {option.label}
                  {selectedPeriod === option.value && (
                    <span className="ml-auto text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="fixed z-50 pointer-events-none animate-fade-in"
          style={{
            left: tooltipData.x + 12,
            top: tooltipData.y - 8,
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-3.5 min-w-[160px]">
            <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-gray-100">
              <span className="text-xl">{getCountryFlag(tooltipData.countryCode)}</span>
              <p className="font-bold text-[#235dcb] text-sm leading-tight">{tooltipData.name}</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Eye className="w-2.5 h-2.5" />
                  Visits
                </span>
                <span className="text-xs font-bold text-[#235dcb]">{tooltipData.visits.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Users className="w-2.5 h-2.5" />
                  Visitors
                </span>
                <span className="text-xs font-bold text-[#235dcb]">{tooltipData.visitors.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Clock className="w-2.5 h-2.5" />
                  Actions
                </span>
                <span className="text-xs font-bold text-[#235dcb]">{tooltipData.actions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(WorldMap);
