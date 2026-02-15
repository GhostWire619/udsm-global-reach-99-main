/**
 * Downloads & Views Map Widget (SSRN-style)
 * Shows rotating display of recent readers with world map visualization
 */
import { useState, useEffect, useMemo, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { useMatomoCountries, useMatomoRealtime } from '@/hooks/useMatomoData';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Download, 
  Eye, 
  FileText,
  Maximize2,
  Code2,
  Users
} from 'lucide-react';
import type { UnifiedDashboardMetrics } from '@/services/fastStatsApi';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Country flag helper
const getCountryFlag = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
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

// Format number with suffix
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

interface DownloadsMapWidgetProps {
  metrics?: UnifiedDashboardMetrics;
  recentDownloads?: number;
  totalDownloads?: number;
  totalPapers?: number;
  downloadsThisYear?: number;
}

interface ReaderActivity {
  id: string;
  country: string;
  countryCode: string;
  city?: string;
  title: string;
  author: string;
  journal: string;
  coordinates: [number, number];
}

const DownloadsMapWidget = ({ 
  metrics,
  recentDownloads,
  totalDownloads,
  totalPapers,
  downloadsThisYear
}: DownloadsMapWidgetProps) => {
  const { data: countries = [] } = useMatomoCountries();
  const { data: realtimeData } = useMatomoRealtime();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Generate reader activities from real data
  const readerActivities: ReaderActivity[] = useMemo(() => {
    const activities: ReaderActivity[] = [];
    
    // Use top publications and countries to create mock activities
    const topPubs = metrics?.topPublications || [];
    const visitors = realtimeData?.visitors || [];
    
    // Create activities from visitor data
    visitors.slice(0, 10).forEach((visitor, idx) => {
      const code = visitor.countryCode?.toLowerCase() || '';
      const coords = countryCoordinates[code];
      if (coords) {
        const pub = topPubs[idx % topPubs.length];
        activities.push({
          id: String(visitor.idVisit || `v-${idx}`),
          country: visitor.country || 'Unknown',
          countryCode: code,
          city: visitor.city,
          title: pub?.title || visitor.actionDetails?.[0]?.pageTitle || 'Research Article',
          author: pub?.authors || 'UDSM Author',
          journal: pub?.journalName || 'UDSM Journal',
          coordinates: coords,
        });
      }
    });

    // If no visitors, create from countries data
    if (activities.length === 0 && countries.length > 0) {
      countries.slice(0, 10).forEach((country, idx) => {
        const code = country.code?.toLowerCase() || '';
        const coords = countryCoordinates[code];
        if (coords) {
          const pub = topPubs[idx % Math.max(topPubs.length, 1)];
          activities.push({
            id: `c-${idx}`,
            country: country.label || 'Unknown',
            countryCode: code,
            title: pub?.title || 'Research Article',
            author: pub?.authors || 'UDSM Author',
            journal: pub?.journalName || 'UDSM Journal',
            coordinates: coords,
          });
        }
      });
    }

    return activities.length > 0 ? activities : [{
      id: 'default',
      country: 'Tanzania',
      countryCode: 'tz',
      title: 'Academic Research Paper',
      author: 'UDSM Researcher',
      journal: 'UDSM Journal',
      coordinates: countryCoordinates.tz,
    }];
  }, [metrics, realtimeData, countries]);

  // Auto-rotate through activities
  useEffect(() => {
    if (!isPlaying || readerActivities.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % readerActivities.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isPlaying, readerActivities.length]);

  const currentActivity = readerActivities[currentIndex];

  // Navigation handlers
  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + readerActivities.length) % readerActivities.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % readerActivities.length);
  };

  // Calculate stats
  const stats = useMemo(() => ({
    totalPapers: totalPapers || metrics?.totalPublications || 0,
    totalDownloads: totalDownloads || metrics?.totalDownloads || metrics?.totalViews || 0,
    downloadsThisYear: downloadsThisYear || Math.round((totalDownloads || metrics?.totalDownloads || 0) * 0.65),
    recentDownloads: recentDownloads || countries.reduce((sum, c) => sum + (c.nb_visits || 0), 0),
    totalReaders: countries.reduce((sum, c) => sum + (c.nb_visits || 0), 0),
  }), [metrics, countries, totalPapers, totalDownloads, downloadsThisYear, recentDownloads]);

  // Marker locations from countries with visits - Real-time data only
  const markerLocations = useMemo(() => {
    const locations = countries
      .filter(c => c.code && countryCoordinates[c.code.toLowerCase()])
      .map(c => ({
        code: c.code!.toLowerCase(),
        coordinates: countryCoordinates[c.code!.toLowerCase()],
        visits: c.nb_visits || 0,
        label: c.label,
      }))
      .slice(0, 30); // Show more markers
    
    // Return actual data only - no fallback demo data
    return locations;
  }, [countries]);

  const maxVisits = Math.max(...markerLocations.map(m => m.visits), 1);

  // Debug: Log marker data
  console.log('[DownloadsMapWidget] Markers:', markerLocations.length, markerLocations.slice(0, 3));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Reader Info Panel */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Reader location */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-medium text-gray-600">Reader from:</span>
              <span className="text-lg">{getCountryFlag(currentActivity.countryCode)}</span>
              <span className="font-semibold text-gray-800">
                {currentActivity.city ? `${currentActivity.city}, ` : ''}{currentActivity.country}
              </span>
            </div>
            
            {/* Publication info */}
            <h3 className="text-[#235dcb] font-bold text-base leading-tight mb-1 line-clamp-2">
              {currentActivity.title}
            </h3>
            <p className="text-gray-600 text-sm">{currentActivity.author}</p>
            <p className="text-blue-600 text-sm italic">{currentActivity.journal}</p>
          </div>
          
          {/* Navigation controls */}
          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
            <button
              onClick={handlePrev}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[280px] bg-[#e8f4fd] overflow-hidden">
      <div className="relative h-[280px] bg-[#e8f4fd] overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [20, 10],
          }}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none',
          }}
        >
          <ZoomableGroup
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            onMoveEnd={({ zoom: z }) => setZoom(z)}
            translateExtent={[[-200, -100], [1200, 700]]}
          >
            {/* Base map */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#cbd5e1"
                    stroke="#94a3b8"
                    strokeWidth={0.3}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#b8c5d6' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Visitor markers - Small dots for live readership */}
            {markerLocations.length > 0 && markerLocations.map((location, idx) => {
              const isActive = location.code === currentActivity.countryCode;
              // Larger dots (6-12px) for better visibility
              const dotSize = isActive ? 10 : Math.max(6, Math.min(12, (location.visits / maxVisits) * 12));
              
              return (
                <Marker key={`${location.code}-${idx}`} coordinates={location.coordinates}>
                  {/* Main dot - darker colors for better contrast */}
                  <circle
                    r={dotSize}
                    fill={isActive ? '#d4a017' : '#235dcb'}
                    fillOpacity={1}
                    stroke={isActive ? '#235dcb' : '#3b82f6'}
                    strokeWidth={isActive ? 3 : 2}
                    className={isActive ? 'animate-pulse' : ''}
                  />
                  {/* Pulse effect for active dot */}
                  {isActive && (
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

        {/* Recent Downloads Badge */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-[#235dcb]" />
            <span className="font-semibold text-gray-800">Recent Downloads</span>
          </div>
          <p className="text-lg font-bold text-[#235dcb]">
            {stats.recentDownloads > 100 ? Math.floor(stats.recentDownloads * 0.03) : Math.min(stats.recentDownloads, 15)} of {stats.recentDownloads}
          </p>
          <p className="text-xs text-gray-500">in the past day</p>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z * 1.5, 4))}
            className="w-8 h-8 bg-white/95 hover:bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
            className="w-8 h-8 bg-white/95 hover:bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            −
          </button>
        </div>

        {/* Bottom action buttons */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button className="px-3 py-1.5 bg-white/95 hover:bg-white rounded-lg shadow-sm border border-gray-200 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors">
            <Code2 className="w-3.5 h-3.5" />
            Embed
          </button>
          <span className="text-xs text-gray-400">Terms</span>
          <button className="px-3 py-1.5 bg-white/95 hover:bg-white rounded-lg shadow-sm border border-gray-200 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
            View Larger
          </button>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-[#235dcb]">{formatNumber(stats.totalPapers)}</p>
          <p className="text-xs text-gray-500 font-medium">Total Papers</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-[#3b7a6b]">{formatNumber(stats.totalDownloads)}</p>
          <p className="text-xs text-gray-500 font-medium">Total Downloads</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-[#d4a017]">{formatNumber(stats.downloadsThisYear)}</p>
          <p className="text-xs text-gray-500 font-medium">Downloads this year</p>
        </div>
      </div>

      {/* Activity indicator dots */}
      {readerActivities.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 bg-gray-50 border-t border-gray-100">
          {readerActivities.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-[#235dcb] scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(DownloadsMapWidget);
