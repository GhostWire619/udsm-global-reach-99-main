import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, BookOpen, Users, Quote, Settings,
  ChevronLeft, ChevronRight, GraduationCap, Sparkles, ArrowLeft,
  BarChart3, Target, Lightbulb, Globe, Shield, Activity,
  Download, Eye, FileText, AlertTriangle, CheckCircle2,
  XCircle, ArrowUpRight, ArrowDownRight, Minus, Info,
  Zap, Award, Layers, Calendar, PieChart, Share2,
  Bell, Moon, Sun, RefreshCw, ExternalLink, Library,
  Send, Clock, Archive, FileCheck, GitCompareArrows, MapPin, Flag
} from 'lucide-react';
import { useFastStatsDashboard } from '@/hooks/useOJSData';
import { useDownloadsPolling, useDownloadsChangeDetector } from '@/hooks/useDownloadsPolling';
import { useMatomoRealtime, useMatomoLiveCounters, useMatomoCountries } from '@/hooks/useMatomoData';
import { computeInsights, type ComputedInsights, type InsightItem } from '@/hooks/useInsightsData';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Cell, PieChart as RechartsPie, Pie, ResponsiveContainer, Tooltip,
} from 'recharts';
import { JournalSelector } from '@/components/JournalSelector';
import RealtimeVisitors from '@/components/RealtimeVisitors';
import AnimatedCounter from '@/components/AnimatedCounter';
import WorldMap from '@/components/WorldMap';
import DownloadsMapWidget from '@/components/DownloadsMapWidget';
import OJS_CONFIG from '@/config/ojs';
import { getFastStatsConfig, getOjsPluginConfig } from '@/config/pluginConfig';
import type { UnifiedDashboardMetrics, FastStatsJournalStats } from '@/services/fastStatsApi';
import { fetchUnifiedDashboardMetrics, triggerCitationFetch, triggerOpenAlexFetch, clearCitationCache } from '@/services/fastStatsApi';

/* ═══════════════════════════════════════════════════════════════
   Types & Nav
   ═══════════════════════════════════════════════════════════════ */
type Panel = 'overview' | 'journals' | 'comparison' | 'impact' | 'engagement' | 'editorial' | 'citations' | 'settings';

const NAV_ITEMS: { id: Panel; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview',   label: 'Overview',         icon: LayoutDashboard },
  { id: 'journals',   label: 'Journals',         icon: Library },
  { id: 'comparison', label: 'Comparison',       icon: GitCompareArrows },
  { id: 'impact',     label: 'Research Impact',  icon: TrendingUp },
  { id: 'engagement', label: 'Engagement',       icon: Activity },
  { id: 'editorial',  label: 'Editorial',        icon: BookOpen },
  { id: 'citations',  label: 'Citations',        icon: Quote },
  { id: 'settings',   label: 'Settings',         icon: Settings },
];

/* ═══════════════════════════════════════════════════════════════
   Main Insights Page
   ═══════════════════════════════════════════════════════════════ */
const InsightsPage = () => {
  const [activePanel, setActivePanel] = useState<Panel>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAnimations, setShowAnimations] = useState(true);

  // Fetch dashboard metrics (historical data)
  const { data: metrics, isLoading, error, refetch } = useFastStatsDashboard(selectedJournalId);
  
  // Poll real-time downloads every 2 seconds
  const { data: pollingData } = useDownloadsPolling(2000, selectedJournalId || undefined, true);
  
  // Detect download changes for animations
  const downloadChange = useDownloadsChangeDetector(pollingData?.totalDownloads);
  
  // Merge polled download data with historical metrics
  const mergedMetrics = useMemo(() => {
    if (!metrics) return metrics;
    if (!pollingData) return metrics;
    
    return {
      ...metrics,
      totalDownloads: pollingData.totalDownloads,
      todayDownloads: pollingData.todayDownloads,
      yearDownloads: pollingData.yearDownloads,
      totalPublications: pollingData.totalPapers,
    };
  }, [metrics, pollingData]);
  
  const insights = useMemo(() => computeInsights(mergedMetrics), [mergedMetrics]);

  const apiJournals = (Array.isArray(metrics?.journals) ? metrics.journals : []).map(j => ({
    id: j.id, urlPath: j.path, name: { en_US: j.name }, enabled: j.enabled, _href: '',
  }));
  const configuredJournals = OJS_CONFIG.journals.map((j, idx) => ({
    id: idx + 1, urlPath: j.urlPath, name: { en_US: j.name }, enabled: true, _href: '',
  }));
  const contexts = apiJournals.length > 0 ? apiJournals : configuredJournals;
  const rawJournals: FastStatsJournalStats[] = Array.isArray(metrics?.journals) ? metrics!.journals : [];

  const handleJournalSelect = (journalId: number | null) => {
    setSelectedJournalId(journalId);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex">
      {/* ── Sidebar ────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          bg-gradient-to-b from-[#235dcb] via-[#1a4d9e] to-[#2f6fd9] text-white shadow-2xl`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-blue-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
              <img src="/udsmlogo.png" alt="UDSM" className="w-10 h-10 object-contain" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#235dcb] animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold tracking-tight text-white leading-tight">
                  UDSM <span className="text-[#d4a017]">Insights</span>
                </h1>
                {pollingData?.realtime && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-blue-200/70 font-medium tracking-wider uppercase">Analytics Hub</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activePanel === id;
            return (
              <button
                key={id}
                onClick={() => setActivePanel(id)}
                title={collapsed ? label : undefined}
                className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
              >
                <div className={`p-1.5 rounded-lg transition-colors duration-200
                  ${isActive ? 'bg-[#d4a017]/20 text-[#d4a017]' : 'text-white group-hover:text-white'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && <span>{label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4a017]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-blue-100">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-blue-200/50 hover:text-white hover:bg-white/10 transition-colors text-xs"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>

        {/* Back to Dashboard */}
        <div className="p-3 border-t border-blue-100">
          <Link
            to="/"
            className={`flex items-center gap-2 py-2 px-3 rounded-lg text-blue-200/50 hover:text-white hover:bg-white/10 transition-colors text-xs ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            {!collapsed && <span>Back to Dashboard</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#235dcb]">
                  {NAV_ITEMS.find(n => n.id === activePanel)?.label}
                </h2>
                <p className="text-xs text-gray-400">
                  {metrics?.lastUpdated
                    ? `Last updated: ${new Date(metrics.lastUpdated).toLocaleString()}`
                    : 'Loading data...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <JournalSelector
                contexts={contexts}
                selectedJournalId={selectedJournalId}
                onJournalChange={handleJournalSelect}
                isLoading={isLoading}
              />
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg text-gray-400 hover:text-[#235dcb] hover:bg-gray-100 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Panel Content */}
        <div className="p-6 max-w-[1400px] mx-auto">
          {isLoading && !metrics ? <LoadingSkeleton /> : error && !metrics ? (
            <ErrorState message={String(error)} onRetry={refetch} />
          ) : (
            <>
              {activePanel === 'overview'   && <OverviewPanel metrics={mergedMetrics!} insights={insights!} showAnimations={showAnimations} onNavigate={setActivePanel} downloadPulsing={downloadChange.hasChanged} />}
              {activePanel === 'journals'   && <JournalsPanel journals={rawJournals} selectedJournalId={selectedJournalId} onSelect={handleJournalSelect} metrics={mergedMetrics} />}
              {activePanel === 'comparison' && <ComparisonPanel journals={rawJournals} />}
              {activePanel === 'impact'     && <ResearchImpactPanel metrics={mergedMetrics!} insights={insights!} />}
              {activePanel === 'engagement' && <EngagementPanel metrics={mergedMetrics!} insights={insights!} />}
              {activePanel === 'editorial'  && <EditorialPanel metrics={mergedMetrics!} insights={insights!} />}
              {activePanel === 'citations'  && <CitationsPanel metrics={mergedMetrics!} insights={insights!} />}
              {activePanel === 'settings'   && (
                <SettingsPanel
                  autoRefresh={autoRefresh}
                  setAutoRefresh={setAutoRefresh}
                  showAnimations={showAnimations}
                  setShowAnimations={setShowAnimations}
                  selectedJournalId={selectedJournalId}
                  journals={contexts}
                  metrics={mergedMetrics}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InsightsPage;

/* ═══════════════════════════════════════════════════════════════
   Shared Small Components
   ═══════════════════════════════════════════════════════════════ */

function InsightCard({ item }: { item: InsightItem }) {
  const colorMap = {
    positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    warning:  { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
    critical: { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-600',     badge: 'bg-red-100 text-red-700' },
    neutral:  { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  };
  const c = colorMap[item.type];
  const IconMap: Record<string, typeof Sparkles> = {
    download: Download, eye: Eye, shield: Shield, alert: AlertTriangle,
    'trending-up': TrendingUp, 'trending-down': ArrowDownRight, quote: Quote,
    globe: Globe, lightbulb: Lightbulb, link: ExternalLink, users: Users,
    calendar: Calendar, share: Share2,
  };
  const Icon = IconMap[item.icon] || Sparkles;

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${c.badge}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
            {item.metric && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{item.metric}</span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sublabel, icon: Icon, color = '#235dcb', trend, animated = false }: {
  label: string; value: string | number; sublabel?: string;
  icon?: typeof Sparkles; color?: string;
  trend?: { value: number; positive: boolean };
  animated?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}10` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        {animated && typeof value === 'number' ? (
          <span className="text-2xl font-bold text-[#235dcb] group-hover:text-[#1a4d9e] transition-colors">
            <AnimatedCounter end={value} duration={2000} />
          </span>
        ) : (
          <span className="text-2xl font-bold text-[#235dcb] group-hover:text-[#1a4d9e] transition-colors">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        )}
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value.toFixed(1)}%
          </span>
        )}
      </div>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

/** Metric Card - Matches SSRN-style dashboard cards */
function MetricCard({ icon: Icon, label, value, change, sublabel, onClick, pulsing = false }: {
  icon: typeof Download;
  label: string;
  value: number;
  change?: number;
  sublabel: string;
  onClick?: () => void;
  pulsing?: boolean;
}) {
  const isPositive = change !== undefined && change >= 0;
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${pulsing ? 'ring-2 ring-[#d4a017] ring-opacity-50 shadow-xl animate-pulse' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-[#e8f4fd]">
          <Icon className="w-5 h-5 text-[#235dcb]" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            <TrendingUp className={`w-4 h-4 ${!isPositive ? 'rotate-180' : ''}`} />
            <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#235dcb] tabular-nums">
        <AnimatedCounter end={value} duration={1800} />
      </p>
      <p className="text-xs text-gray-400 mt-2">{sublabel}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: typeof Sparkles }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#235dcb] to-[#2f6fd9] shadow-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-[#235dcb]">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function BenchmarkBar({ label, value, benchmark, unit, status }: {
  label: string; value: number; benchmark: number; unit: string;
  status: 'above' | 'below' | 'average';
}) {
  const maxVal = Math.max(value, benchmark) * 1.3;
  const valueWidth = (value / maxVal) * 100;
  const benchWidth = (benchmark / maxVal) * 100;
  const statusColor = status === 'above' ? 'text-emerald-600' : status === 'below' ? 'text-red-500' : 'text-amber-500';
  const barColor = status === 'above' ? '#10b981' : status === 'below' ? '#ef4444' : '#f59e0b';

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#235dcb]">{value.toFixed(1)}{unit}</span>
          <span className={`text-xs font-medium ${statusColor}`}>
            {status === 'above' ? 'Above Avg' : status === 'below' ? 'Below Avg' : 'Average'}
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute h-full rounded-full transition-all duration-1000" style={{ width: `${valueWidth}%`, backgroundColor: barColor }} />
        <div className="absolute h-full w-0.5 bg-gray-400 top-0" style={{ left: `${benchWidth}%` }} title={`Benchmark: ${benchmark.toFixed(1)}${unit}`} />
      </div>
      <div className="flex justify-end mt-1">
        <span className="text-[10px] text-gray-400">Benchmark: {benchmark.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Loading / Error States
   ═══════════════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-[400px] rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="p-4 rounded-2xl bg-red-50 mb-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="font-display text-lg font-bold text-gray-800 mb-2">Unable to Load Data</h3>
      <p className="text-sm text-gray-500 max-w-md mb-6">{message}</p>
      <button onClick={onRetry} className="px-6 py-2.5 rounded-lg bg-[#235dcb] text-white text-sm font-medium hover:bg-[#1a4d9e] transition-colors">
        Retry
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Overview — World Map, Live Metrics, Matomo Real-time
   ═══════════════════════════════════════════════════════════════ */
function OverviewPanel({ metrics, insights, showAnimations, onNavigate, downloadPulsing = false }: { 
  metrics: UnifiedDashboardMetrics; 
  insights: ComputedInsights; 
  showAnimations: boolean; 
  onNavigate: (panel: Panel) => void;
  downloadPulsing?: boolean;
}) {
  const { data: realtimeData } = useMatomoRealtime();
  const { data: countersData } = useMatomoLiveCounters(30);
  const { data: countries } = useMatomoCountries('month', 'today');
  const counters = (Array.isArray(countersData) && countersData.length > 0 ? countersData[0] : null) as { visitors?: number; visits?: number; actions?: number } | null;
  const liveCounters = counters || (realtimeData as { counters?: { visitors?: number; visits?: number; actions?: number } })?.counters;

  return (
    <div className={`space-y-6 ${showAnimations ? 'animate-fade-in' : ''}`}>
      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={Download} 
          label="Total Downloads" 
          value={metrics.totalDownloads} 
          change={21.8} 
          onClick={() => onNavigate('engagement')}
          pulsing={downloadPulsing}
          sublabel="real-time updates"
        />
        <MetricCard 
          icon={Quote} 
          label="Citations" 
          value={metrics.allCitations?.summary?.totalCitations || (metrics.citations as { totalCitations?: number })?.totalCitations || 0} 
          change={12.2} 
          onClick={() => onNavigate('citations')}
          sublabel="aggregated"
        />
        <MetricCard 
          icon={Users} 
          label="Active Readers" 
          value={liveCounters?.visitors || 0} 
          change={24.0} 
          sublabel="currently online" 
          onClick={() => onNavigate('engagement')}
        />
        <MetricCard 
          icon={BookOpen} 
          label="Published Papers" 
          value={metrics.totalPublications} 
          change={8.6} 
          sublabel="total in repository" 
          onClick={() => onNavigate('journals')}
        />
      </div>

      {/* World Map & Real-time Visitors */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* World Map - Global Reach Visualization */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Global Reach" subtitle="Visitor distribution across the world" icon={Globe} />
          <div className="mt-4">
            <WorldMap />
          </div>
        </div>

        <div className="lg:col-span-4">
          <RealtimeVisitors />
        </div>
      </div>

      {/* Downloads & Views Widget (SSRN-style) - Hidden */}
      <div className="hidden">
        <DownloadsMapWidget metrics={metrics} />
      </div>

      {/* Top Countries + Recent Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Top Countries" subtitle="Readers by geographic location" icon={Flag} />
          <div className="space-y-3 mt-4">
            {countries && countries.length > 0 ? (
              countries.slice(0, 8).map((country, idx) => (
                <TopCountryRow key={country.label || idx} country={country} index={idx} totalVisits={countries.reduce((sum, c) => sum + (c.nb_visits || 0), 0)} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No country data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Publications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Recent Publications" subtitle="Top articles by engagement" icon={FileText} />
          <div className="space-y-3 mt-4">
            {metrics.topPublications && metrics.topPublications.length > 0 ? (
              metrics.topPublications.slice(0, 6).map((pub, idx) => (
                <TopPublicationRow key={pub.publicationId ?? idx} publication={pub} index={idx} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No publications data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Animated live counter in the hero bar */
function LiveCounter({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-[#235dcb] tabular-nums">
        <AnimatedCounter end={value} duration={1800} />
      </p>
      <p className="text-[11px] text-[#235dcb]/60 font-medium mt-0.5">{label}</p>
    </div>
  );
}

/** Country flag helper */
const getCountryFlag = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const code = countryCode.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
};

/** Top country row component */
function TopCountryRow({ country, index, totalVisits }: { country: { label: string; nb_visits?: number; code?: string }; index: number; totalVisits: number }) {
  const visits = country.nb_visits || 0;
  const percentage = totalVisits > 0 ? ((visits / totalVisits) * 100).toFixed(1) : '0';
  const flag = getCountryFlag(country.code || '');
  
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-lg w-8 text-center">{flag}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800 truncate">{country.label || 'Unknown'}</span>
          <span className="text-sm font-semibold text-[#235dcb]">{visits.toLocaleString()}</span>
        </div>
        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-[#235dcb]" 
            style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }} 
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
    </div>
  );
}

/** Top publication row component */
function TopPublicationRow({ publication, index }: { publication: { id?: number; title: string; views?: number; downloads?: number; journalName?: string }; index: number }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#235dcb]/10 rounded text-xs font-bold text-[#235dcb]">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 line-clamp-2">{publication.title}</p>
        {publication.journalName && (
          <p className="text-xs text-gray-500 mt-0.5">{publication.journalName}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
          <Eye className="w-3 h-3" />
          {(publication.views || 0).toLocaleString()}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
          <Download className="w-3 h-3" />
          {(publication.downloads || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Journals — List all journals, select to see metrics
   ═══════════════════════════════════════════════════════════════ */
function JournalsPanel({ journals, selectedJournalId, onSelect, metrics }: {
  journals: FastStatsJournalStats[];
  selectedJournalId: number | null;
  onSelect: (id: number | null) => void;
  metrics: UnifiedDashboardMetrics | undefined;
}) {
  const [viewingJournal, setViewingJournal] = useState<FastStatsJournalStats | null>(null);

  const handleView = (journal: FastStatsJournalStats) => {
    setViewingJournal(journal);
    onSelect(journal.id);
  };

  const handleBack = () => {
    setViewingJournal(null);
    onSelect(null);
  };

  if (viewingJournal && metrics) {
    return <JournalDetailView journal={viewingJournal} metrics={metrics} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="UDSM Journals" subtitle="Select a journal to view detailed analytics" icon={Library} />

      {journals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Library className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-gray-800 mb-2">No Journals Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Journal data will appear once the Fast Stats API returns journal information. Check your connection settings.
          </p>
        </div>
      ) : (
        <>
          {/* Aggregated Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[#235dcb]">
                <Layers className="w-5 h-5 text-[#e8b624]" />
              </div>
              <div>
                <h4 className="font-display text-lg font-bold text-[#235dcb]">All Journals Combined</h4>
                <p className="text-xs text-gray-500">{journals.length} journals registered</p>
              </div>
              <button
                onClick={() => onSelect(null)}
                className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedJournalId === null ? 'bg-[#235dcb] text-white' : 'bg-white text-[#235dcb] border border-gray-200 hover:bg-gray-50'}`}
              >
                View Aggregated
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#235dcb]">{journals.reduce((s, j) => s + j.totalSubmissions, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Submissions</p>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-600">{journals.reduce((s, j) => s + j.publishedArticles, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Published Articles</p>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{journals.reduce((s, j) => s + j.activeSubmissions, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Active Submissions</p>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{journals.reduce((s, j) => s + j.publishedIssues, 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Published Issues</p>
              </div>
            </div>
          </div>

          {/* Journals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journals.map((journal) => (
              <div
                key={journal.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-100/30 hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                onClick={() => handleView(journal)}
              >
                {/* Journal Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-[#e8f4fd] shadow-sm border border-blue-100 group-hover:shadow-md transition-shadow">
                    <BookOpen className="w-6 h-6 text-[#235dcb]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base font-bold text-[#235dcb] group-hover:text-[#1a4d9e] transition-colors truncate">
                      {journal.name}
                    </h4>
                    {journal.abbreviation && (
                      <span className="text-xs font-medium text-[#d4a017] bg-amber-50 px-2 py-0.5 rounded-full">{journal.abbreviation}</span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">/{journal.path}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${journal.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                    <span className={`text-xs font-medium ${journal.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {journal.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Journal Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                    <p className="text-lg font-bold text-[#235dcb]">{journal.totalSubmissions}</p>
                    <p className="text-[10px] text-gray-500">Submissions</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                    <p className="text-lg font-bold text-emerald-600">{journal.publishedArticles}</p>
                    <p className="text-[10px] text-gray-500">Published</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg group-hover:bg-amber-50 transition-colors">
                    <p className="text-lg font-bold text-amber-600">{journal.activeSubmissions}</p>
                    <p className="text-[10px] text-gray-500">Active</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg group-hover:bg-purple-50 transition-colors">
                    <p className="text-lg font-bold text-purple-600">{journal.publishedIssues}</p>
                    <p className="text-[10px] text-gray-500">Issues</p>
                  </div>
                </div>

                {/* View Button */}
                <div className="mt-4 flex justify-end">
                  <span className="text-xs font-medium text-[#235dcb] group-hover:text-[#d4a017] flex items-center gap-1 transition-colors">
                    View Analytics <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Detail view for a selected journal with live data */
function JournalDetailView({ journal, metrics, onBack }: {
  journal: FastStatsJournalStats;
  metrics: UnifiedDashboardMetrics;
  onBack: () => void;
}) {
  const { data: realtimeData } = useMatomoRealtime();
  const { data: countersData } = useMatomoLiveCounters(30);
  const { data: countries } = useMatomoCountries('month', 'today');
  const counters = (Array.isArray(countersData) && countersData.length > 0 ? countersData[0] : null) as { visitors?: number; visits?: number; actions?: number } | null;
  const liveCounters = counters || (realtimeData as { counters?: { visitors?: number; visits?: number; actions?: number } })?.counters;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Journal Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#235dcb]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#e8f4fd] shadow-sm border border-blue-100">
              <BookOpen className="w-6 h-6 text-[#235dcb]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold text-[#235dcb] truncate">{journal.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {journal.abbreviation && <span className="text-xs font-medium text-[#d4a017] bg-amber-50 px-2 py-0.5 rounded-full">{journal.abbreviation}</span>}
                <span className="text-xs text-gray-400">/{journal.path}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${journal.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Banner */}
      <div className="bg-[#e8f4fd] rounded-2xl p-5 text-[#235dcb] border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#235dcb]/60 uppercase tracking-wider">Live Activity</span>
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-600">Live</span>
            <span className="text-[10px] text-emerald-600">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold"><AnimatedCounter end={liveCounters?.visitors || 0} duration={1500} /></p>
            <p className="text-[11px] text-[#235dcb]/60 mt-0.5">Active Visitors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold"><AnimatedCounter end={liveCounters?.visits || 0} duration={1500} /></p>
            <p className="text-[11px] text-[#235dcb]/60 mt-0.5">Visits (30m)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold"><AnimatedCounter end={liveCounters?.actions || 0} duration={1500} /></p>
            <p className="text-[11px] text-[#235dcb]/60 mt-0.5">Page Actions</p>
          </div>
        </div>
      </div>

      {/* Journal KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Views" value={metrics.totalViews} icon={Eye} color="#235dcb" animated />
        <StatBox label="Downloads" value={metrics.totalDownloads} icon={Download} color="#d4a017" animated />
        <StatBox label="Abstract Views" value={metrics.totalAbstractViews} icon={BarChart3} color="#1a4d9e" animated />
        <StatBox label="Users" value={metrics.totalUsers} icon={Users} color="#10b981" animated />
      </div>

      {/* Real-time Visitors */}
      <div className="grid grid-cols-1 gap-6">
        <RealtimeVisitors />
      </div>

      {/* Top Countries */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader title="Top Countries" subtitle="Readers by geographic location" icon={Flag} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {countries && countries.length > 0 ? (
            countries.slice(0, 8).map((country, idx) => (
              <TopCountryRow key={country.label || idx} country={country} index={idx} totalVisits={countries.reduce((sum, c) => sum + (c.nb_visits || 0), 0)} />
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-muted-foreground">
              <Globe className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No country data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Submissions + Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Submissions & Publications</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <Send className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{metrics.totalSubmissions || 0}</p>
              <p className="text-[10px] text-blue-500">Total Submissions</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <BookOpen className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-700">{metrics.totalPublications || 0}</p>
              <p className="text-[10px] text-emerald-500">Published</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-700">{metrics.activeSubmissions || 0}</p>
              <p className="text-[10px] text-amber-500">Active</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <Calendar className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-700">{metrics.submissionsScheduled || 0}</p>
              <p className="text-[10px] text-purple-500">Scheduled</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <Archive className="w-4 h-4 text-slate-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-700">{metrics.totalIssues || 0}</p>
              <p className="text-[10px] text-slate-500">Total Issues</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-xl">
              <FileCheck className="w-4 h-4 text-teal-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-teal-700">{metrics.publishedIssues || 0}</p>
              <p className="text-[10px] text-teal-500">Published Issues</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Editorial Pipeline</h4>
          <div className="space-y-3">
            <PipelineRow label="Received" value={metrics.submissionsReceived || 0} total={metrics.totalSubmissions || 1} color="#235dcb" />
            <PipelineRow label="Accepted" value={metrics.submissionsAccepted || 0} total={metrics.totalSubmissions || 1} color="#10b981" />
            <PipelineRow label="Published" value={metrics.totalPublications || 0} total={metrics.totalSubmissions || 1} color="#1a4d9e" />
            <PipelineRow label="In Review" value={metrics.submissionsQueued || 0} total={metrics.totalSubmissions || 1} color="#f59e0b" />
          </div>
        </div>
      </div>



      {/* Citations */}
      {metrics.allCitations?.summary && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Citation Impact</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <p className="text-xl font-bold text-purple-600">{metrics.allCitations.summary.totalCitations}</p>
              <p className="text-[10px] text-purple-500">Total Citations</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-xl">
              <p className="text-xl font-bold text-indigo-600">{metrics.allCitations.summary.publicationsWithCitations}</p>
              <p className="text-[10px] text-indigo-500">Cited Pubs</p>
            </div>
            <div className="text-center p-3 bg-violet-50 rounded-xl">
              <p className="text-xl font-bold text-violet-600">{metrics.allCitations.summary.maxCitations}</p>
              <p className="text-[10px] text-violet-500">Max Citations</p>
            </div>
            <div className="text-center p-3 bg-fuchsia-50 rounded-xl">
              <p className="text-xl font-bold text-fuchsia-600">{metrics.allCitations.summary.avgCitations.toFixed(1)}</p>
              <p className="text-[10px] text-fuchsia-500">Avg Citations</p>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-xl">
              <p className="text-xl font-bold text-pink-600">{metrics.allCitations.summary.totalPublications}</p>
              <p className="text-[10px] text-pink-500">Indexed</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Publications */}
      {metrics.topPublications && metrics.topPublications.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Top Publications</h4>
          <div className="space-y-2">
            {metrics.topPublications.slice(0, 5).map((pub: { publicationId: number; title: string; datePublished?: string; abstractViews?: number; fileDownloads?: number }, idx: number) => (
              <div key={pub.publicationId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                  ${idx < 3 ? 'bg-gradient-to-br from-[#d4a017] to-[#e8b624]' : 'bg-gray-300'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{pub.title}</p>
                  <p className="text-xs text-gray-400">{pub.datePublished || ''}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(pub.abstractViews || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {(pub.fileDownloads || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-800">{value.toLocaleString()} <span className="font-normal text-gray-400">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Comparison — Compare two journals side by side
   ═══════════════════════════════════════════════════════════════ */
function ComparisonPanel({ journals }: { journals: FastStatsJournalStats[] }) {
  const [journalA, setJournalA] = useState<FastStatsJournalStats | null>(journals[0] || null);
  const [journalB, setJournalB] = useState<FastStatsJournalStats | null>(journals[1] || null);
  const [dashboardA, setDashboardA] = useState<UnifiedDashboardMetrics | null>(null);
  const [dashboardB, setDashboardB] = useState<UnifiedDashboardMetrics | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Fetch full dashboard data for Journal A when selected
  useEffect(() => {
    if (!journalA) return;
    setLoadingA(true);
    fetchUnifiedDashboardMetrics(journalA.id)
      .then(setDashboardA)
      .catch(err => {
        console.error('Failed to fetch dashboard for Journal A:', err);
        setDashboardA(null);
      })
      .finally(() => setLoadingA(false));
  }, [journalA?.id]);

  // Fetch full dashboard data for Journal B when selected
  useEffect(() => {
    if (!journalB) return;
    setLoadingB(true);
    fetchUnifiedDashboardMetrics(journalB.id)
      .then(setDashboardB)
      .catch(err => {
        console.error('Failed to fetch dashboard for Journal B:', err);
        setDashboardB(null);
      })
      .finally(() => setLoadingB(false));
  }, [journalB?.id]);

  // Prepare chart data - now includes downloads, views, citations
  // Keep showing data even during loading (will show old data until new data arrives)
  const chartData = useMemo(() => {
    if (!dashboardA || !dashboardB) return [];
    
    return [
      { metric: 'Downloads', journalA: dashboardA.totalDownloads || 0, journalB: dashboardB.totalDownloads || 0 },
      { metric: 'Views', journalA: dashboardA.totalViews || 0, journalB: dashboardB.totalViews || 0 },
      { metric: 'Citations', journalA: dashboardA.allCitations?.summary?.totalCitations || 0, journalB: dashboardB.allCitations?.summary?.totalCitations || 0 },
      { metric: 'Published', journalA: dashboardA.totalPublications || 0, journalB: dashboardB.totalPublications || 0 },
      { metric: 'Issues', journalA: dashboardA.publishedIssues || 0, journalB: dashboardB.publishedIssues || 0 },
      { metric: 'Submissions', journalA: dashboardA.totalSubmissions || 0, journalB: dashboardB.totalSubmissions || 0 },
    ];
  }, [dashboardA, dashboardB]);

  const chartConfig: ChartConfig = {
    journalA: { label: journalA?.abbreviation || 'Journal A', color: '#235dcb' },
    journalB: { label: journalB?.abbreviation || 'Journal B', color: '#d4a017' },
  };

  const CompareMetric = ({ label, valueA, valueB, format = 'number' }: { label: string; valueA: number; valueB: number; format?: 'number' | 'percent' }) => {
    const maxVal = Math.max(valueA, valueB);
    const pctA = maxVal > 0 ? (valueA / maxVal) * 100 : 0;
    const pctB = maxVal > 0 ? (valueB / maxVal) * 100 : 0;
    const formattedA = format === 'percent' ? `${valueA}%` : valueA.toLocaleString();
    const formattedB = format === 'percent' ? `${valueB}%` : valueB.toLocaleString();
    const diff = valueA - valueB;
    const winner = diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie';

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-4 border-b border-gray-100 last:border-0">
        <div className="text-right">
          <span className={`text-lg font-bold ${winner === 'A' ? 'text-emerald-600' : 'text-gray-700'}`}>{formattedA}</span>
          <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#235dcb] rounded-full transition-all duration-500" style={{ width: `${pctA}%`, marginLeft: 'auto' }} />
          </div>
        </div>
        <div className="text-center">
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <div className="text-left">
          <span className={`text-lg font-bold ${winner === 'B' ? 'text-emerald-600' : 'text-gray-700'}`}>{formattedB}</span>
          <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#d4a017] rounded-full transition-all duration-500" style={{ width: `${pctB}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#e8f4fd] rounded-2xl p-6 text-[#235dcb] border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <GitCompareArrows className="w-5 h-5 text-[#d4a017]" />
          <GitCompareArrows className="w-5 h-5 text-[#d4a017]" />
          <h2 className="font-display text-xl font-bold">Journal Comparison</h2>
        </div>
        <p className="text-sm text-[#235dcb]/60">Compare metrics between two journals side by side</p>
      </div>

      {/* Journal Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-[#235dcb]" />
            <span className="text-sm font-medium text-gray-600">Journal A</span>
          </div>
          <select 
            value={journalA?.id || ''} 
            onChange={(e) => setJournalA(journals.find(j => j.id === Number(e.target.value)) || null)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#235dcb]/20 truncate"
          >
            {journals.map(j => (
              <option key={j.id} value={j.id}>{j.abbreviation || j.path.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-[#d4a017]" />
            <span className="text-sm font-medium text-gray-600">Journal B</span>
          </div>
          <select 
            value={journalB?.id || ''} 
            onChange={(e) => setJournalB(journals.find(j => j.id === Number(e.target.value)) || null)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#d4a017]/20 truncate"
          >
            {journals.map(j => (
              <option key={j.id} value={j.id}>{j.abbreviation || j.path.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {journalA && journalB ? (
        <>
          {/* Loading State */}
          {(loadingA || loadingB) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Loading detailed metrics for {loadingA && loadingB ? 'both journals' : loadingA ? journalA.name : journalB?.name}...
                </p>
              </div>
            </div>
          )}

          {/* Success Info Banner */}
          {!loadingA && !loadingB && dashboardA && dashboardB && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 mb-1">Full Metrics Comparison</h4>
                  <p className="text-sm text-emerald-700">
                    Comparing downloads, views, citations, publications, and submissions across both journals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart Comparison - Hidden */}
          {false && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 relative">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#235dcb]" />
              <h3 className="font-display text-lg font-bold text-[#235dcb]">Visual Comparison</h3>
            </div>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#235dcb]" />
                <span className="text-sm text-gray-600 truncate max-w-[120px]">{journalA.abbreviation || journalA.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#d4a017]" />
                <span className="text-sm text-gray-600 truncate max-w-[120px]">{journalB.abbreviation || journalB.name}</span>
              </div>
            </div>
            
            {/* Loading Overlay */}
            {(loadingA || loadingB) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-[#235dcb] animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading data...</p>
                </div>
              </div>
            )}

            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="category" dataKey="metric" />
                <YAxis type="number" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="journalA" fill="#235dcb" radius={[4, 4, 0, 0]} maxBarSize={50} name={journalA.abbreviation || 'Journal A'} />
                <Bar dataKey="journalB" fill="#d4a017" radius={[4, 4, 0, 0]} maxBarSize={50} name={journalB.abbreviation || 'Journal B'} />
              </BarChart>
            </ChartContainer>
          </div>
          )}

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[#235dcb]" />
              <h3 className="font-display text-lg font-bold text-[#235dcb]">Detailed Metrics</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200 mb-4">
              <div className="text-right">
                <span className="text-sm font-bold text-[#235dcb] truncate block max-w-[120px]">{journalA.abbreviation || journalA.name}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Metric</span>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[#d4a017] truncate block max-w-[120px]">{journalB.abbreviation || journalB.name}</span>
              </div>
            </div>

            {dashboardA && dashboardB ? (
              <>
                <CompareMetric label="Total Downloads" valueA={dashboardA.totalDownloads || 0} valueB={dashboardB.totalDownloads || 0} />
                <CompareMetric label="Total Views" valueA={dashboardA.totalViews || 0} valueB={dashboardB.totalViews || 0} />
                <CompareMetric label="Abstract Views" valueA={dashboardA.totalAbstractViews || 0} valueB={dashboardB.totalAbstractViews || 0} />
                <CompareMetric label="Citations" valueA={dashboardA.allCitations?.summary?.totalCitations || 0} valueB={dashboardB.allCitations?.summary?.totalCitations || 0} />
                <CompareMetric label="Published Articles" valueA={dashboardA.totalPublications || 0} valueB={dashboardB.totalPublications || 0} />
                <CompareMetric label="Total Submissions" valueA={dashboardA.totalSubmissions || 0} valueB={dashboardB.totalSubmissions || 0} />
                <CompareMetric label="Active Submissions" valueA={dashboardA.activeSubmissions || 0} valueB={dashboardB.activeSubmissions || 0} />
                <CompareMetric label="Published Issues" valueA={dashboardA.publishedIssues || 0} valueB={dashboardB.publishedIssues || 0} />
                <CompareMetric 
                  label="Avg Citations" 
                  valueA={dashboardA.allCitations?.summary?.avgCitations ? Math.round(dashboardA.allCitations.summary.avgCitations * 10) / 10 : 0} 
                  valueB={dashboardB.allCitations?.summary?.avgCitations ? Math.round(dashboardB.allCitations.summary.avgCitations * 10) / 10 : 0} 
                />
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading comparison data...</p>
              </div>
            )}
          </div>


        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <GitCompareArrows className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Select two journals to compare</p>
        </div>
      )}
    </div>
  );
}

/** Metric winner card */
function MetricWinner({ label, winnerName, winnerColor, value }: { label: string; winnerName: string; winnerColor: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color: winnerColor }}>{value}</p>
      <p className="text-xs font-medium mt-1" style={{ color: winnerColor }}>{winnerName}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Research Impact
   ═══════════════════════════════════════════════════════════════ */
const pubYearChartConfig: ChartConfig = {
  count: { label: 'Publications', color: '#235dcb' },
};

function ResearchImpactPanel({ metrics, insights }: { metrics: UnifiedDashboardMetrics; insights: ComputedInsights }) {
  const yearData = [...(metrics.publicationsByYear || [])].sort((a, b) => a.year - b.year);
  const sectionData = (metrics.publicationsBySection || []).slice(0, 8);
  const COLORS = ['#235dcb', '#1a4d9e', '#d4a017', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Publications" value={metrics.totalPublications} icon={BookOpen} color="#235dcb" animated />
        <StatBox label="Published Issues" value={metrics.publishedIssues} icon={Layers} color="#1a4d9e" animated />
        <StatBox
          label="Growth Rate"
          value={`${insights.publicationGrowthRate >= 0 ? '+' : ''}${insights.publicationGrowthRate.toFixed(0)}%`}
          icon={TrendingUp}
          color={insights.publicationGrowthRate >= 0 ? '#10b981' : '#ef4444'}
        />
        <StatBox label="Active Submissions" value={metrics.activeSubmissions} icon={FileText} color="#d4a017" animated />
      </div>

      {/* Benchmarks */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader title="Performance Benchmarks" subtitle="Compared to global academic journal averages" icon={Target} />
        <div className="divide-y divide-gray-50">
          {insights.benchmarks.map(b => (
            <BenchmarkBar key={b.label} {...b} />
          ))}
        </div>
      </div>

      {/* Publications by Year Chart */}
      {yearData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Publications by Year" subtitle="Historical publication output" icon={BarChart3} />
          <ChartContainer config={pubYearChartConfig} className="h-[280px] w-full">
            <BarChart data={yearData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {yearData.map((_, idx) => (
                  <Cell key={idx} fill={idx === yearData.length - 1 ? '#d4a017' : '#235dcb'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* Publications by Section Pie - Hidden */}
      {false && sectionData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Publications by Section" subtitle="Distribution across journal sections" icon={PieChart} />
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-full lg:w-1/2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={sectionData}
                    dataKey="count"
                    nameKey="sectionName"
                    cx="50%" cy="50%"
                    outerRadius={100} innerRadius={55}
                    paddingAngle={3} strokeWidth={2} stroke="#fff"
                  >
                    {sectionData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} pubs`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {sectionData.map((s, idx) => (
                <div key={s.sectionId} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm text-gray-600 flex-1 truncate">{s.sectionName}</span>
                  <span className="text-sm font-semibold text-gray-800">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Publications */}
      {metrics.topPublications?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Top Performing Publications" subtitle="Ranked by total views" icon={Award} />
          <div className="space-y-3">
            {metrics.topPublications.slice(0, 8).map((pub, idx) => (
              <div key={pub.publicationId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${idx < 3 ? 'bg-gradient-to-br from-[#d4a017] to-[#e8b624]' : 'bg-gray-300'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{pub.title}</p>
                  <p className="text-xs text-gray-400">{pub.journalName} {pub.datePublished ? `• ${pub.datePublished}` : ''}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(pub.abstractViews || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {(pub.fileDownloads || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Engagement Analytics
   ═══════════════════════════════════════════════════════════════ */
const timelineChartConfig: ChartConfig = {
  abstractViews: { label: 'Abstract Views', color: '#235dcb' },
  fileDownloads: { label: 'Downloads', color: '#d4a017' },
};

function EngagementPanel({ metrics, insights }: { metrics: UnifiedDashboardMetrics; insights: ComputedInsights }) {
  const timelineData = (metrics.viewsTimeline || []).map(t => ({
    date: t.date,
    abstractViews: t.abstractViews,
    fileDownloads: t.fileDownloads,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Engagement Funnel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader title="Reader Engagement Funnel" subtitle="How readers interact with your content" icon={Target} />
        <div className="space-y-4">
          {insights.engagementFunnel.map((step, idx) => {
            const maxVal = insights.engagementFunnel[0].value || 1;
            const width = Math.max((step.value / maxVal) * 100, 8);
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#235dcb]">{step.value.toLocaleString()}</span>
                    {step.rate !== undefined && idx > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {step.rate.toFixed(1)}% conversion
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-gray-50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                    style={{ width: `${width}%`, backgroundColor: step.color }}
                  >
                    {width > 20 && (
                      <span className="text-xs font-medium text-white/90">{step.value.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Abstract Views" value={metrics.totalAbstractViews} icon={Eye} color="#235dcb" animated />
        <StatBox label="Downloads" value={metrics.totalDownloads} icon={Download} color="#d4a017" animated />
        <StatBox label="Views / Publication" value={insights.viewsPerPublication.toFixed(0)} icon={BarChart3} color="#1a4d9e" />
        <StatBox label="Download Rate" value={`${insights.downloadToViewRatio.toFixed(1)}%`} icon={TrendingUp} color="#10b981" />
      </div>

      {/* Timeline */}
      {timelineData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Views Over Time" subtitle="Abstract views vs downloads trend" icon={Activity} />
          <ChartContainer config={timelineChartConfig} className="h-[280px] w-full">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="insAbstractGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#235dcb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#235dcb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="insDownloadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="abstractViews" stroke="#235dcb" fill="url(#insAbstractGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="fileDownloads" stroke="#d4a017" fill="url(#insDownloadGrad)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      {/* Engagement-specific insights */}
      <div className="space-y-3">
        {insights.insights
          .filter(i => ['high-dl-ratio', 'low-dl-ratio', 'high-engagement', 'total-reach'].includes(i.id))
          .map(item => <InsightCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Editorial Performance
   ═══════════════════════════════════════════════════════════════ */
function EditorialPanel({ metrics, insights }: { metrics: UnifiedDashboardMetrics; insights: ComputedInsights }) {
  const total = metrics.totalSubmissions || 1;
  const editorialPipeline = [
    { label: 'Received',  value: metrics.submissionsReceived,  color: '#235dcb', pct: ((metrics.submissionsReceived / total) * 100).toFixed(0) },
    { label: 'Accepted',  value: metrics.submissionsAccepted,  color: '#10b981', pct: ((metrics.submissionsAccepted / total) * 100).toFixed(0) },
    { label: 'Published', value: metrics.totalPublications,    color: '#1a4d9e', pct: ((metrics.totalPublications / total) * 100).toFixed(0) },
    { label: 'Declined',  value: metrics.submissionsDeclined,  color: '#ef4444', pct: ((metrics.submissionsDeclined / total) * 100).toFixed(0) },
    { label: 'In Queue',  value: metrics.submissionsQueued,    color: '#f59e0b', pct: ((metrics.submissionsQueued / total) * 100).toFixed(0) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox label="Total Submissions" value={metrics.totalSubmissions} icon={FileText} color="#235dcb" animated />
        <StatBox label="Active" value={metrics.activeSubmissions} icon={Activity} color="#1a4d9e" animated />
        <StatBox label="Scheduled" value={metrics.submissionsScheduled} icon={Calendar} color="#8b5cf6" animated />
      </div>

      {/* Editorial Pipeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader title="Submission Pipeline" subtitle="Flow from submission to publication" icon={Layers} />
        <div className="grid grid-cols-5 gap-3">
          {editorialPipeline.map((stage, idx) => (
            <div key={stage.label} className="relative">
              <div className="bg-gray-50 rounded-xl p-4 text-center hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: stage.color }}>
                  {stage.pct}%
                </div>
                <p className="text-xl font-bold text-[#235dcb]">{(stage.value || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{stage.label}</p>
              </div>
              {idx < editorialPipeline.length - 1 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-300 hidden lg:block">&rarr;</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Roles */}
      {metrics.usersByRole?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionHeader title="Team Composition" subtitle="Users by editorial role" icon={Users} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.usersByRole.slice(0, 8).map((role, idx) => (
              <div key={role.roleId} className="text-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: ['#235dcb', '#1a4d9e', '#d4a017', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'][idx % 8] }}>
                  {role.count}
                </div>
                <p className="text-xs font-medium text-gray-600">{role.roleName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editorial insights */}
      <div className="space-y-3">
        {insights.insights
          .filter(i => ['selective-journal'].includes(i.id))
          .map(item => <InsightCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Citations Analysis
   ═══════════════════════════════════════════════════════════════ */
function CitationsPanel({ metrics, insights }: { metrics: UnifiedDashboardMetrics; insights: ComputedInsights }) {
  const citationSummary = metrics.allCitations?.summary;
  const topCited = metrics.topCitedPublications || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {citationSummary ? (
        <>
          {/* Citation KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatBox label="Total Citations" value={citationSummary.totalCitations} icon={Quote} color="#7c3aed" animated />
            <StatBox label="Cited Publications" value={citationSummary.publicationsWithCitations} icon={BookOpen} color="#6366f1" animated />
            <StatBox label="Max Citations" value={citationSummary.maxCitations} icon={Award} color="#d946ef" animated />
            <StatBox label="Avg Citations" value={citationSummary.avgCitations.toFixed(2)} icon={BarChart3} color="#ec4899" />
            <StatBox label="Total Indexed" value={citationSummary.totalPublications} icon={Layers} color="#8b5cf6" animated />
          </div>

          {/* Source Breakdown - Compact */}
          {(citationSummary.fromCrossref !== undefined || citationSummary.fromOpenalex !== undefined) && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Citation Sources</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">C</span>
                    <span className="text-sm font-bold text-blue-700">{citationSummary.fromCrossref || 0}</span>
                    <span className="text-xs text-blue-500">Crossref</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">O</span>
                    <span className="text-sm font-bold text-green-700">{citationSummary.fromOpenalex || 0}</span>
                    <span className="text-xs text-green-500">OpenAlex</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Cited */}
          {topCited.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <SectionHeader title="Most Cited Publications" subtitle="Your highest-impact research" icon={Award} />
              <div className="space-y-3">
                {topCited.slice(0, 10).map((pub, idx) => (
                  <div key={pub.publicationId} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50/50 to-transparent hover:from-purple-50 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0
                      ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-200' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600' :
                        'bg-gray-300'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{pub.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pub.doi && (
                          <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline truncate max-w-[200px]">{pub.doi}</a>
                        )}
                        {pub.citationSource && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                            ${pub.citationSource === 'crossref' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {pub.citationSource}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0 w-16">
                      <p className="text-xl font-bold text-purple-600">{pub.citationCount}</p>
                      <p className="text-[10px] text-gray-400">citations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="p-4 rounded-2xl bg-purple-50 inline-flex mb-4">
            <Quote className="w-8 h-8 text-purple-300" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-800 mb-2">Citation Data Not Available</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Enable Crossref or OpenAlex citation tracking in the Fast Stats plugin to see citation analysis.
            Publications need DOIs to be tracked.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL: Settings
   ═══════════════════════════════════════════════════════════════ */
function SettingsPanel({ autoRefresh, setAutoRefresh, showAnimations, setShowAnimations, selectedJournalId, journals, metrics }: {
  autoRefresh: boolean; setAutoRefresh: (v: boolean) => void;
  showAnimations: boolean; setShowAnimations: (v: boolean) => void;
  selectedJournalId: number | null;
  journals: { id: number; urlPath: string; name: { en_US: string }; enabled: boolean }[];
  metrics: UnifiedDashboardMetrics | undefined;
}) {
  const [citationFetchStatus, setCitationFetchStatus] = useState<{
    loading: boolean;
    message?: string;
    type?: 'success' | 'error' | 'info';
  }>({ loading: false });

  // Get JWT token from plugin config or use default
  const pluginConfig = getOjsPluginConfig();
  const fastStatsConfig = getFastStatsConfig();
  const jwtToken = fastStatsConfig.jwtToken || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.ImZkYjU3NGU2NjgxY2ExMzg0YTk3MjA1YTYwZjNkMzlmOGE4NDlhYjMi.d1NKmyEhGCZclI5_nO_vsXmc1JnOGy0m2b2qFUjRH3s';

  const handleFetchCrossrefCitations = async () => {
    setCitationFetchStatus({ loading: true, message: 'Fetching citations from Crossref...', type: 'info' });
    
    const journalPath = journals.find(j => j.id === selectedJournalId)?.urlPath || journals[0]?.urlPath;
    if (!journalPath) {
      setCitationFetchStatus({ loading: false, message: 'No journal selected', type: 'error' });
      return;
    }

    try {
      const result = await triggerCitationFetch(journalPath, {
        limit: 100,
        onlyMissing: true,
        email: 'admin@udsm.ac.tz',
        jwtToken: jwtToken,
      });
      
      setCitationFetchStatus({
        loading: false,
        message: `Success: ${result.successful} citations fetched, ${result.failed} failed`,
        type: 'success',
      });
      
      toast({
        title: "Citations Updated",
        description: `Fetched ${result.successful} citations from Crossref`,
      });
    } catch (error) {
      setCitationFetchStatus({
        loading: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      
      toast({
        title: "Citation Fetch Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleFetchOpenAlexCitations = async () => {
    setCitationFetchStatus({ loading: true, message: 'Fetching citations from OpenAlex...', type: 'info' });
    
    const journalPath = journals.find(j => j.id === selectedJournalId)?.urlPath || journals[0]?.urlPath;
    if (!journalPath) {
      setCitationFetchStatus({ loading: false, message: 'No journal selected', type: 'error' });
      return;
    }

    try {
      const result = await triggerOpenAlexFetch(journalPath, {
        limit: 50,
        onlyMissing: true,
        email: 'admin@udsm.ac.tz',
        jwtToken: jwtToken,
      });
      
      setCitationFetchStatus({
        loading: false,
        message: `Success: ${result.found} citations found, ${result.notFound} not found`,
        type: 'success',
      });
      
      toast({
        title: "Citations Updated",
        description: `Fetched ${result.found} citations from OpenAlex`,
      });
    } catch (error) {
      setCitationFetchStatus({
        loading: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
      
      toast({
        title: "Citation Fetch Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <SectionHeader title="Dashboard Settings" subtitle="Customize your insights experience" icon={Settings} />

      {/* Citation Management */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Citation Management</h4>
          <Quote className="w-5 h-5 text-indigo-600" />
        </div>
        
        <p className="text-sm text-gray-600">
          Manually update citation counts from external sources. Citations are automatically fetched daily at 3 AM, or you can trigger manual updates below.
        </p>

        {/* Status Banner */}
        {citationFetchStatus.message && (
          <div className={`p-3 rounded-xl border ${
            citationFetchStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
            citationFetchStatus.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {citationFetchStatus.loading ? (
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : citationFetchStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : citationFetchStatus.type === 'error' ? (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                citationFetchStatus.type === 'success' ? 'text-emerald-700' :
                citationFetchStatus.type === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {citationFetchStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Current Citation Stats */}
        {metrics?.allCitations?.summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <p className="text-xs text-indigo-600 font-medium mb-1">Total Citations</p>
              <p className="text-2xl font-bold text-indigo-900">{metrics.allCitations.summary.totalCitations?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <p className="text-xs text-purple-600 font-medium mb-1">Avg per Publication</p>
              <p className="text-2xl font-bold text-purple-900">
                {metrics.allCitations.summary.avgCitations ? metrics.allCitations.summary.avgCitations.toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium mb-1">From Crossref</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.allCitations.summary.fromCrossref?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl">
              <p className="text-xs text-teal-600 font-medium mb-1">From OpenAlex</p>
              <p className="text-2xl font-bold text-teal-900">{metrics.allCitations.summary.fromOpenalex?.toLocaleString() || 0}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleFetchCrossrefCitations}
            disabled={citationFetchStatus.loading}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-900">Fetch Crossref Citations</p>
                <p className="text-xs text-blue-600">For publications with DOIs</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={handleFetchOpenAlexCitations}
            disabled={citationFetchStatus.loading}
            className="w-full flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-teal-900">Fetch OpenAlex Citations</p>
                <p className="text-xs text-teal-600">For publications without DOIs (title search)</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-teal-600" />
          </button>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> Fetching citations may take several minutes depending on the number of publications. 
            Only missing citations will be fetched by default.
          </p>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Authentication Required:</strong> If you receive a "CSRF Invalid" error (403), you need to be logged in to OJS 
              in the same browser session. OJS requires valid authentication for citation fetch operations as a security measure.
            </p>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Display</h4>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Auto Refresh</p>
            <p className="text-xs text-gray-400">Automatically reload data on schedule</p>
          </div>
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Animations</p>
            <p className="text-xs text-gray-400">Enable smooth transitions and fade-ins</p>
          </div>
          <Switch checked={showAnimations} onCheckedChange={setShowAnimations} />
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Data Sources</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#235dcb] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#e8b624]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Fast Stats API</p>
                <p className="text-xs text-gray-400">OJS publication & editorial data</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${metrics ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {metrics ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Matomo Analytics</p>
                <p className="text-xs text-gray-400">Real-time visitor tracking</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Citation Sources</p>
                <p className="text-xs text-gray-400">Crossref + OpenAlex</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${metrics?.allCitations ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {metrics?.allCitations ? 'Active' : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Journals */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Configured Journals</h4>
        <div className="space-y-2">
          {journals.map(j => (
            <div key={j.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate">{j.name.en_US}</p>
                  <p className="text-xs text-gray-400">/{j.urlPath}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                selectedJournalId === j.id ? 'bg-blue-100 text-blue-700' : j.enabled ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-500'
              }`}>
                {selectedJournalId === j.id ? 'Selected' : j.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-[#e8f4fd] rounded-2xl p-6 text-[#235dcb] border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <img src="/udsmlogo.png" alt="UDSM" className="w-8 h-8 object-contain" />
          <img src="/udsmlogo.png" alt="UDSM" className="w-8 h-8 object-contain" />
          <h4 className="font-display text-lg font-bold">UDSM Insights Dashboard</h4>
        </div>
        <p className="text-sm text-[#235dcb]/70 leading-relaxed">
          Built for the University of Dar es Salaam to provide actionable intelligence from journal analytics.
          Powered by Fast Stats API + Matomo Analytics with Crossref and OpenAlex citation integration.
        </p>
        <p className="text-xs text-[#235dcb]/40 mt-4">
          Version 2.0.0 &bull; &copy; 2026 University of Dar es Salaam
        </p>
      </div>
    </div>
  );
}
