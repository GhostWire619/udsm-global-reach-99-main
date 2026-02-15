/**
 * Real-time Visitors Component
 * Shows live visitor activity from Matomo Analytics
 */
import { Users, Globe, Monitor, Smartphone, Tablet, Clock, Eye, MapPin, Activity } from "lucide-react";
import { useMatomoRealtime, useMatomoLiveCounters } from "@/hooks/useMatomoData";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MatomoVisitor } from "@/services/matomoApi";

// Country flag helper
const getCountryFlag = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
};

// Device icon helper
const getDeviceIcon = (deviceType: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'smartphone':
      return <Smartphone className="w-3.5 h-3.5" />;
    case 'tablet':
      return <Tablet className="w-3.5 h-3.5" />;
    default:
      return <Monitor className="w-3.5 h-3.5" />;
  }
};

// Format time ago
const formatTimeAgo = (timestamp: number) => {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Single visitor row component
const VisitorRow = ({ visitor, index }: { visitor: MatomoVisitor; index: number }) => {
  const lastAction = visitor.actionDetails?.[0];
  const pageTitle = lastAction?.pageTitle || lastAction?.title || 'Browsing';
  const countryName = visitor.country || 'Unknown';
  const flag = getCountryFlag(visitor.countryCode);
  
  return (
    <div 
      className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50/50 to-transparent rounded-lg hover:from-green-50 transition-colors animate-slide-in-right"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Country flag - larger and more prominent */}
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl bg-white rounded-full shadow-sm border border-gray-100" title={countryName}>
        {flag}
      </div>
      
      {/* Visitor info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-semibold text-[#003366] truncate block">
                Reader from {countryName}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reader from {countryName}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {getDeviceIcon(visitor.deviceType)}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <span className="truncate max-w-[120px] cursor-help">{pageTitle}</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="max-w-[300px] z-[9999] bg-gray-900 text-white px-3 py-2">
                <p className="text-xs break-words whitespace-normal">{pageTitle}</p>
              </TooltipContent>
            </Tooltip>
          </span>
        </div>
      </div>
      
      {/* Time */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-medium text-green-600">
          {formatTimeAgo(visitor.lastActionTimestamp)}
        </p>
      </div>
    </div>
  );
};

const RealtimeVisitors = () => {
  const { data: realtimeData, isLoading, error } = useMatomoRealtime();
  const { data: countersData } = useMatomoLiveCounters(30);
  
  // countersData is an array, get first item
  const counters = (Array.isArray(countersData) && countersData.length > 0 ? countersData[0] : null) || realtimeData?.counters;
  const visitors = realtimeData?.visitors || [];
  const visitorsByCountry = realtimeData?.visitorsByCountry || [];

  // Debug logging
  console.log('[RealtimeVisitors] Component state:', {
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasRealtimeData: !!realtimeData,
    visitorsCount: visitors.length,
    countersValue: counters,
    countriesCount: visitorsByCountry.length,
  });

  if (error) {
    return (
      <div className="glass-card p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-red-500" />
          <h3 className="font-display text-lg font-semibold text-foreground">Real-time Visitors</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Unable to connect to Matomo</p>
          <p className="text-xs mt-1 text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[hsl(210,100%,20%)]" />
          <h3 className="font-display text-lg font-semibold text-foreground">Real-time Visitors</h3>
        </div>
        <div className="live-indicator">
          <span>Live</span>
        </div>
      </div>

      {/* Live counters */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{counters?.visitors || 0}</p>
            <p className="text-xs text-green-700 mt-0.5">Active Now</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{counters?.visits || 0}</p>
            <p className="text-xs text-blue-700 mt-0.5">Visits (30m)</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{counters?.actions || 0}</p>
            <p className="text-xs text-purple-700 mt-0.5">Actions</p>
          </div>
        </div>
      )}

      {/* Top countries (horizontal pills) */}
      {visitorsByCountry.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Top Locations</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visitorsByCountry.slice(0, 5).map((item, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs"
              >
                {getCountryFlag(item.countryCode)}
                <span className="font-medium">{item.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent visitors list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))
        ) : visitors.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No active visitors</p>
            <p className="text-xs mt-1 opacity-70">
              {counters && (counters.visits > 0 || counters.actions > 0) 
                ? `Data connected (${counters.visits} visits today)` 
                : 'Waiting for visitor data...'}
            </p>
          </div>
        ) : (
          visitors.slice(0, 8).map((visitor, index) => (
            <VisitorRow key={visitor.idVisit} visitor={visitor} index={index} />
          ))
        )}
      </div>

      {/* Summary footer */}
      {realtimeData?.summary && (
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{realtimeData.summary.totalPageViews}</p>
            <p className="text-xs text-muted-foreground">Page Views</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{realtimeData.summary.avgTimeOnSite}</p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{realtimeData.summary.bounceRate}</p>
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};

export default RealtimeVisitors;
