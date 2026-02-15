/**
 * Matomo Analytics API Integration
 * 
 * Real-time visitor tracking and analytics from Matomo
 * API Documentation: https://developer.matomo.org/api-reference/reporting-api
 */

import { getMatomoConfig } from '@/config/pluginConfig';

// Matomo Configuration - get from plugin config or defaults
export const MATOMO_CONFIG = getMatomoConfig();

/* ══════════════════════════════════════════════════════════════════
   Type Definitions
   ══════════════════════════════════════════════════════════════════ */

/** Real-time visitor counter */
export interface MatomoLiveCounters {
  visits: number;
  actions: number;
  visitors: number;
  visitsConverted: number;
}

/** Single visitor details */
export interface MatomoVisitor {
  idSite: number;
  idVisit: number;
  visitIp: string;
  visitorId: string;
  fingerprint?: string;
  actionDetails: MatomoAction[];
  goalConversions: number;
  siteCurrency: string;
  siteCurrencySymbol: string;
  
  // Location
  country: string;
  countryCode: string;
  countryFlag: string;
  region: string;
  regionCode: string;
  city: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  
  // Visit info
  visitCount: number;
  daysSinceLastVisit: number;
  secondsSinceLastVisit: number;
  visitDuration: number;
  visitDurationPretty: string;
  visitLocalTime: string;
  visitLocalHour: string;
  visitServerHour: string;
  firstActionTimestamp: number;
  lastActionTimestamp: number;
  lastActionDateTime: string;
  serverDate: string;
  serverTimestamp: number;
  serverTimePretty: string;
  serverDatePretty: string;
  serverDatePrettyFirstAction: string;
  serverTimePrettyFirstAction: string;
  
  // Device info
  deviceType: string;
  deviceTypeIcon: string;
  deviceBrand: string;
  deviceModel: string;
  operatingSystem: string;
  operatingSystemName: string;
  operatingSystemIcon: string;
  operatingSystemCode: string;
  operatingSystemVersion: string;
  browser: string;
  browserName: string;
  browserIcon: string;
  browserCode: string;
  browserVersion: string;
  browserFamily: string;
  browserFamilyDescription: string;
  
  // Referrer
  referrerType: string;
  referrerTypeName: string;
  referrerName: string;
  referrerKeyword: string;
  referrerKeywordPosition: number | null;
  referrerUrl: string;
  referrerSearchEngineUrl?: string;
  referrerSearchEngineIcon?: string;
  referrerSocialNetworkUrl?: string;
  referrerSocialNetworkIcon?: string;
  
  // Language
  language: string;
  languageCode: string;
  
  // User info
  userId: string | null;
  totalEcommerceRevenue: number;
  totalEcommerceConversions: number;
  totalEcommerceItems: number;
  totalAbandonedCarts: number;
  totalAbandonedCartsRevenue: number;
  totalAbandonedCartsItems: number;
  
  // Events count
  events: number;
  
  // Resolution
  resolution: string;
  
  // Plugins
  plugins: string;
  pluginsIcons: MatomoPluginIcon[];
}

/** Plugin icon info */
export interface MatomoPluginIcon {
  pluginIcon: string;
  pluginName: string;
}

/** Action details */
export interface MatomoAction {
  type: string;
  url: string;
  pageTitle: string;
  pageIdAction: number;
  idpageview: string;
  serverTimePretty: string;
  pageId: number;
  timeSpent: string;
  timeSpentPretty: string;
  pageviewPosition: number;
  title: string;
  subtitle: string;
  icon: string;
  iconSVG: string;
  timestamp: number;
}

/** Visits summary */
export interface MatomoVisitsSummary {
  nb_uniq_visitors: number;
  nb_visits: number;
  nb_actions: number;
  nb_visits_converted: number;
  bounce_count: number;
  sum_visit_length: number;
  max_actions: number;
  bounce_rate: string;
  nb_actions_per_visit: number;
  avg_time_on_site: number;
}

/** Countries data */
export interface MatomoCountry {
  label: string;
  nb_visits: number;
  nb_actions: number;
  nb_uniq_visitors: number;
  max_actions: number;
  sum_visit_length: number;
  bounce_count: number;
  nb_visits_converted: number;
  logo: string;
  segment: string;
  code: string;
}

/** Page views data */
export interface MatomoPageView {
  label: string;
  nb_visits: number;
  nb_hits: number;
  nb_uniq_visitors?: number;
  sum_time_spent: number;
  entry_nb_visits?: number;
  entry_nb_actions?: number;
  entry_sum_visit_length?: number;
  entry_bounce_count?: number;
  exit_nb_visits?: number;
  avg_time_on_page: number;
  bounce_rate: string;
  exit_rate: string;
  url: string;
  segment: string;
}

/** Real-time dashboard data */
export interface MatomoRealtimeData {
  counters: MatomoLiveCounters;
  visitors: MatomoVisitor[];
  visitorsByCountry: { country: string; countryCode: string; count: number }[];
  recentActions: MatomoAction[];
  summary: {
    activeVisitors: number;
    totalPageViews: number;
    avgTimeOnSite: string;
    bounceRate: string;
  };
}

/* ══════════════════════════════════════════════════════════════════
   API Functions
   ══════════════════════════════════════════════════════════════════ */

/**
 * Build Matomo API URL
 */
function buildMatomoUrl(method: string, params: Record<string, string | number> = {}): string {
  // In development, baseUrl is '/matomo-api' (relative path)
  // In production, baseUrl is 'https://matomo.themenumanager.xyz' (absolute URL)
  const baseUrl = MATOMO_CONFIG.baseUrl.startsWith('http') 
    ? MATOMO_CONFIG.baseUrl 
    : window.location.origin + MATOMO_CONFIG.baseUrl;
  
  const url = new URL(`${baseUrl}/index.php`);
  
  // Required params
  url.searchParams.set('module', 'API');
  url.searchParams.set('method', method);
  url.searchParams.set('idSite', MATOMO_CONFIG.siteId.toString());
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('token_auth', MATOMO_CONFIG.authToken);
  
  // Additional params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value.toString());
  });
  
  return url.toString();
}

/**
 * Fetch with error handling
 */
async function matomoFetch<T>(method: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = buildMatomoUrl(method, params);
  
  console.log(`[Matomo] Fetching ${method}...`, params);
  console.log(`[Matomo] URL:`, url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log(`[Matomo] Response status:`, response.status, response.statusText);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Matomo] Error response:`, text);
      throw new Error(`Matomo API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Matomo] ${method} data:`, data);
    
    // Check for Matomo error response
    if (data && typeof data === 'object' && 'result' in data && data.result === 'error') {
      console.error(`[Matomo] API returned error:`, data.message);
      throw new Error(`Matomo API error: ${data.message}`);
    }
    
    return data as T;
  } catch (error) {
    console.error(`[Matomo] Fetch failed for ${method}:`, error);
    throw error;
  }
}

/**
 * Get real-time visitor count (last N minutes)
 * Live.getCounters - Returns an array with one object
 */
export async function getLiveCounters(lastMinutes: number = 30): Promise<MatomoLiveCounters[]> {
  const result = await matomoFetch<MatomoLiveCounters[]>('Live.getCounters', {
    lastMinutes,
  });
  console.log('[Matomo] getLiveCounters raw result:', result);
  return result;
}

/**
 * Get last visitors details
 * Live.getLastVisitsDetails
 */
export async function getLastVisitorsDetails(count: number = 10): Promise<MatomoVisitor[]> {
  return matomoFetch<MatomoVisitor[]>('Live.getLastVisitsDetails', {
    filter_limit: count,
  });
}

/**
 * Get visits summary for today
 * VisitsSummary.get
 */
export async function getVisitsSummary(period: string = 'day', date: string = 'today'): Promise<MatomoVisitsSummary> {
  return matomoFetch<MatomoVisitsSummary>('VisitsSummary.get', {
    period,
    date,
  });
}

/**
 * Get visitors by country
 * UserCountry.getCountry
 */
export async function getVisitorsByCountry(period: string = 'day', date: string = 'today'): Promise<MatomoCountry[]> {
  return matomoFetch<MatomoCountry[]>('UserCountry.getCountry', {
    period,
    date,
  });
}

/**
 * Get top pages
 * Actions.getPageUrls
 */
export async function getTopPages(period: string = 'day', date: string = 'today', limit: number = 10): Promise<MatomoPageView[]> {
  return matomoFetch<MatomoPageView[]>('Actions.getPageUrls', {
    period,
    date,
    filter_limit: limit,
    flat: 1,
  });
}

/**
 * Get page titles
 * Actions.getPageTitles
 */
export async function getPageTitles(period: string = 'day', date: string = 'today', limit: number = 10): Promise<MatomoPageView[]> {
  return matomoFetch<MatomoPageView[]>('Actions.getPageTitles', {
    period,
    date,
    filter_limit: limit,
  });
}

/**
 * Get referrers
 * Referrers.getAll
 */
export async function getReferrers(period: string = 'day', date: string = 'today'): Promise<unknown> {
  return matomoFetch('Referrers.getAll', {
    period,
    date,
  });
}

/**
 * Get device types
 * DevicesDetection.getType
 */
export async function getDeviceTypes(period: string = 'day', date: string = 'today'): Promise<unknown> {
  return matomoFetch('DevicesDetection.getType', {
    period,
    date,
  });
}

/**
 * Get browsers
 * DevicesDetection.getBrowsers
 */
export async function getBrowsers(period: string = 'day', date: string = 'today'): Promise<unknown> {
  return matomoFetch('DevicesDetection.getBrowsers', {
    period,
    date,
  });
}

/**
 * Get visits over time (for charts)
 * VisitsSummary.getVisits
 */
export async function getVisitsOverTime(period: string = 'day', date: string = 'last30'): Promise<Record<string, number>> {
  return matomoFetch<Record<string, number>>('VisitsSummary.getVisits', {
    period,
    date,
  });
}

/**
 * Format seconds to readable time
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Fetch all real-time data for dashboard
 */
export async function fetchMatomoRealtimeData(): Promise<MatomoRealtimeData> {
  console.log('[Matomo] Fetching real-time dashboard data...');
  
  try {
    // Fetch data in parallel
    const [countersResult, visitors, summary, countries] = await Promise.all([
      getLiveCounters(30).catch(err => {
        console.error('[Matomo] getLiveCounters failed:', err);
        return [{ visits: 0, actions: 0, visitors: 0, visitsConverted: 0 }];
      }),
      getLastVisitorsDetails(20).catch(err => {
        console.error('[Matomo] getLastVisitorsDetails failed:', err);
        return [];
      }),
      getVisitsSummary('day', 'today').catch(err => {
        console.error('[Matomo] getVisitsSummary failed:', err);
        return {
          nb_uniq_visitors: 0,
          nb_visits: 0,
          nb_actions: 0,
          nb_visits_converted: 0,
          bounce_count: 0,
          sum_visit_length: 0,
          max_actions: 0,
          bounce_rate: '0%',
          nb_actions_per_visit: 0,
          avg_time_on_site: 0,
        };
      }),
      getVisitorsByCountry('day', 'today').catch(err => {
        console.error('[Matomo] getVisitorsByCountry failed:', err);
        return [];
      }),
    ]);
    
    console.log('[Matomo] Real-time data fetched:', {
      countersResult: countersResult,
      visitorsCount: visitors.length,
      countriesCount: countries.length,
      summaryExists: !!summary,
    });
    
    // Get counters (first item from array)
    const counters = Array.isArray(countersResult) && countersResult.length > 0 
      ? countersResult[0] 
      : { visits: 0, actions: 0, visitors: 0, visitsConverted: 0 };
    
    console.log('[Matomo] Extracted counters:', counters);
    
    // Process visitors by country
    const visitorsByCountry = countries.slice(0, 10).map(c => ({
      country: c.label,
      countryCode: c.code?.toLowerCase() || '',
      count: c.nb_visits,
    }));
    
    // Get recent actions from visitors
    const recentActions: MatomoAction[] = visitors
      .flatMap(v => v.actionDetails || [])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
    
    return {
      counters,
      visitors,
      visitorsByCountry,
      recentActions,
      summary: {
        activeVisitors: counters.visitors,
        totalPageViews: summary.nb_actions,
        avgTimeOnSite: formatDuration(summary.avg_time_on_site || 0),
        bounceRate: summary.bounce_rate || '0%',
      },
    };
  } catch (error) {
    console.error('[Matomo] Error fetching real-time data:', error);
    throw error;
  }
}

/**
 * Test Matomo connection
 */
export async function testMatomoConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await getVisitsSummary('day', 'today');
    return { connected: true, message: 'Connected to Matomo Analytics' };
  } catch (error) {
    return { connected: false, message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/* ══════════════════════════════════════════════════════════════════
   Downloads Tracking (requires Matomo Downloads tracking enabled)
   ══════════════════════════════════════════════════════════════════ */

/** Download event data */
export interface MatomoDownload {
  label: string;
  nb_visits: number;
  nb_hits: number;
  nb_uniq_visitors?: number;
  sum_time_spent: number;
  url: string;
  segment?: string;
}

/**
 * Fetch file downloads data
 * Requires Downloads & Outlinks tracking enabled in Matomo
 */
export async function getDownloads(period: string = 'day', date: string = 'today', limit: number = 50): Promise<MatomoDownload[]> {
  try {
    const result = await matomoFetch<MatomoDownload[] | { result: string }>('Actions.getDownloads', {
      period,
      date,
      filter_limit: limit,
      expanded: '1',
    });
    
    // Handle empty result or error
    if (!result || (typeof result === 'object' && 'result' in result)) {
      return [];
    }
    
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.warn('[Matomo] Downloads tracking may not be enabled:', error);
    return [];
  }
}

/**
 * Get real-time downloads from recent visitors' actions
 * Filters actions for download events
 */
export async function getRealtimeDownloads(lastMinutes: number = 30): Promise<{ filename: string; url: string; timestamp: number; country: string; countryCode: string }[]> {
  try {
    const visitors = await getLastVisitorsDetails(100);
    
    const downloads: { filename: string; url: string; timestamp: number; country: string; countryCode: string }[] = [];
    
    visitors.forEach(visitor => {
      (visitor.actionDetails || []).forEach(action => {
        // Check if action is a download (type 'download' or URL contains download indicators)
        if (action.type === 'download' || 
            action.url?.includes('/download/') || 
            action.url?.includes('.pdf') ||
            action.url?.match(/\.(pdf|doc|docx|xls|xlsx|zip|rar|tar|gz)(\?|$)/i)) {
          
          // Extract filename from URL
          const filename = action.url?.split('/').pop()?.split('?')[0] || 'Unknown file';
          
          downloads.push({
            filename,
            url: action.url,
            timestamp: action.timestamp,
            country: visitor.country,
            countryCode: visitor.countryCode,
          });
        }
      });
    });
    
    // Sort by most recent
    return downloads.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.warn('[Matomo] Error fetching realtime downloads:', error);
    return [];
  }
}
