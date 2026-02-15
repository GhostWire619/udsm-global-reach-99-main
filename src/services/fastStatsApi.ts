/**
 * Fast Stats API Service
 * Optimized API endpoints with pre-aggregated statistics
 * 
 * Key advantage: The /dashboard endpoint returns all data in ONE call
 * instead of making 6+ separate API requests.
 */

import OJS_CONFIG from '@/config/ojs';
import { getFastStatsConfig } from '@/config/pluginConfig';

// Get config from OJS plugin or defaults
const FAST_STATS_CONFIG = getFastStatsConfig();

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Use JWT token from plugin config first, then fall back to OJS config
  const jwtToken = FAST_STATS_CONFIG.jwtToken || (OJS_CONFIG as any).apiKey;
  if (jwtToken) {
    headers.Authorization = `Bearer ${jwtToken}`;
  }
  
  return headers;
};

/* ══════════════════════════════════════════════════════════════════
   TypeScript Interfaces (from Fast Stats API documentation)
   ══════════════════════════════════════════════════════════════════ */

export interface FastStatsCountsResponse {
  totalSubmissions: number;
  publishedArticles: number;
  activeSubmissions: number;
  declinedSubmissions: number;
  scheduledSubmissions: number;
  totalIssues: number;
  publishedIssues: number;
  totalUsers: number;
  contextId: number | null;
  lastUpdated: string;
}

export interface FastStatsDownloadsResponse {
  abstractViews: number;
  fileDownloads: number;
  totalViews: number;
  contextId: number | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export interface FastStatsEditorialResponse {
  submissionsReceived: number;
  submissionsQueued: number;
  submissionsPublished: number;
  submissionsDeclined: number;
  submissionsScheduled: number;
  acceptanceRate: number;
  rejectionRate: number;
  contextId: number | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export interface FastStatsRoleCount {
  roleId: number;
  roleName: string;
  count: number;
}

export interface FastStatsUsersResponse {
  totalUsers: number;
  byRole: FastStatsRoleCount[];
  contextId: number | null;
}

export interface FastStatsTimelineEntry {
  period: string;
  date: string;
  abstractViews: number;
  fileDownloads: number;
  totalViews: number;
}

export interface FastStatsPublicationWithStats {
  submissionId: number;
  publicationId: number;
  contextId: number;
  status?: number;
  title: string;
  authors?: string;
  journalPath: string;
  journalName: string;
  sectionId: number;
  sectionName: string;
  datePublished: string | null;
  abstractViews?: number;
  fileDownloads?: number;
  totalViews?: number;
}

export interface FastStatsYearCount {
  year: number;
  count: number;
}

export interface FastStatsSectionCount {
  sectionId: number;
  sectionName: string;
  count: number;
}

export interface FastStatsAggregatedResponse {
  totalJournals: number;
  activeJournals: number;
  totalSubmissions: number;
  totalPublished: number;
  totalActive: number;
  totalDeclined: number;
  totalIssues: number;
  totalUsers: number;
  totalAbstractViews: number;
  totalDownloads: number;
  dateStart: string | null;
  dateEnd: string | null;
  lastUpdated: string;
}

export interface FastStatsJournalStats {
  id: number;
  path: string;
  name: string;
  abbreviation: string;
  description: string;
  enabled: boolean;
  totalSubmissions: number;
  publishedArticles: number;
  activeSubmissions: number;
  publishedIssues: number;
}

/** Citations response (legacy) */
export interface FastStatsCitationsResponse {
  available: boolean;
  message?: string;
  totalCitations: number;
  publicationsWithCitations?: number;
  contextId?: number | null;
}

/* ══════════════════════════════════════════════════════════════════
   Crossref Citation Types (New in v1.1.0.0)
   ══════════════════════════════════════════════════════════════════ */

/** Single publication with Crossref citation data */
export interface CrossrefCitationItem {
  submissionId: number;
  publicationId: number;
  contextId: number;
  title: string;
  doi: string;
  datePublished: string | null;
  citationCount: number;
  citationLastUpdated: string | null;
  citationSource: string | null;
  journalPath: string;
  journalName: string;
}

/** Citation summary statistics */
export interface CrossrefCitationSummary {
  totalPublications: number;
  publicationsWithCitations: number;
  totalCitations: number;
  maxCitations: number;
  avgCitations: number;
}

/** Response from /citations/crossref endpoint */
export interface CrossrefCitationsResponse {
  items: CrossrefCitationItem[];
  itemsMax: number;
  summary: CrossrefCitationSummary;
  contextId: number | null;
}

/** Publication with DOI */
export interface PublicationWithDOI {
  submissionId: number;
  publicationId: number;
  contextId: number;
  title: string;
  doi: string;
  datePublished: string | null;
  journalPath: string;
}

/** Response from /citations/dois endpoint */
export interface PublicationsWithDOIsResponse {
  items: PublicationWithDOI[];
  itemsMax: number;
}

/** Single fetch result */
export interface FetchCitationsResult {
  doi: string;
  title: string;
  citationCount?: number;
  status: 'success' | 'fetch_failed' | 'save_failed';
  error?: string;
}

/** Response from POST /citations/fetch */
export interface FetchCitationsResponse {
  success: boolean;
  message: string;
  processed: number;
  successful: number;
  failed: number;
  results: FetchCitationsResult[];
  log: string[];
}

/** Response from POST /citations/clear */
export interface ClearCitationsResponse {
  success: boolean;
  message: string;
  deletedRecords: number;
  contextId: number | null;
}

/* ══════════════════════════════════════════════════════════════════
   New Citation Types (v1.1.0.0 - OpenAlex & Unified)
   ══════════════════════════════════════════════════════════════════ */

/** Publication without DOI (from /citations/no-doi) */
export interface PublicationWithoutDOI {
  submissionId: number;
  publicationId: number;
  contextId: number;
  title: string;
  datePublished: string | null;
  authors: string;
  journalPath: string;
  journalName: string;
  citationCount: number | null;
  hasCitationData: boolean;
}

/** Response from /citations/no-doi */
export interface PublicationsWithoutDOIsResponse {
  items: PublicationWithoutDOI[];
  itemsMax: number;
}

/** Unified citation item (from /citations/all) */
export interface UnifiedCitationItem {
  submissionId: number;
  publicationId: number;
  contextId: number;
  title: string;
  doi: string | null;
  hasDoi: boolean;
  datePublished: string | null;
  citationCount: number;
  citationLastUpdated: string | null;
  citationSource: string | null;
  journalPath: string;
  journalName: string;
}

/** Extended citation summary with source breakdown */
export interface UnifiedCitationSummary {
  totalPublications: number;
  publicationsWithCitations: number;
  totalCitations: number;
  maxCitations: number;
  avgCitations: number;
  fromCrossref: number;
  fromOpenalex: number;
}

/** Response from /citations/all endpoint */
export interface AllCitationsResponse {
  items: UnifiedCitationItem[];
  itemsMax: number;
  summary: UnifiedCitationSummary;
  contextId: number | null;
}

/** OpenAlex fetch sample result */
export interface OpenAlexSampleResult {
  publicationId: number;
  title: string;
  citationCount: number;
  confidence: number;
}

/** Response from POST /citations/fetch-openalex */
export interface FetchOpenAlexResponse {
  success: boolean;
  message: string;
  processed: number;
  found: number;
  notFound: number;
  sourcesUpdated: {
    new: number;
    existing: number;
  };
  totalCitations: number;
  sampleResults: OpenAlexSampleResult[];
}

/** Complete dashboard response - everything in one call! */
export interface FastStatsDashboardResponse {
  counts: FastStatsCountsResponse;
  downloads: FastStatsDownloadsResponse;
  editorial: FastStatsEditorialResponse;
  users: FastStatsUsersResponse;
  topPublications: FastStatsPublicationWithStats[];
  recentPublications: FastStatsPublicationWithStats[];
  publicationsByYear: FastStatsYearCount[];
  publicationsBySection: FastStatsSectionCount[];
  viewsTimeline: FastStatsTimelineEntry[];
  lastUpdated: string;
  filters?: {
    contextId: number;
    orderBy: string;
    orderDirection: string;
  };
}

/* ══════════════════════════════════════════════════════════════════
   Real-Time Polling API (for download statistics)
   ══════════════════════════════════════════════════════════════════ */

/** Response from /stats/poll endpoint - real-time download statistics */
export interface StatsPollingResponse {
  todayDownloads: number;
  totalDownloads: number;
  yearDownloads: number;
  totalPapers: number;
  timestamp: number;
  realtime: true;
}

/* ══════════════════════════════════════════════════════════════════
   Unified Dashboard Metrics (compatible with existing UI)
   ══════════════════════════════════════════════════════════════════ */

export interface UnifiedDashboardMetrics {
  // Key metrics
  totalDownloads: number;
  totalAbstractViews: number;
  totalViews: number;
  totalPublications: number;
  totalUsers: number;
  totalSubmissions: number;
  
  // Editorial metrics
  submissionsReceived: number;
  submissionsAccepted: number;
  submissionsDeclined: number;
  submissionsQueued: number;
  submissionsScheduled: number;
  activeSubmissions: number;
  acceptanceRate: number;
  rejectionRate: number;
  
  // Counts
  totalIssues: number;
  publishedIssues: number;
  
  // User breakdown
  usersByRole: FastStatsRoleCount[];
  
  // Timeline for charts
  viewsTimeline: FastStatsTimelineEntry[];
  
  // Publications data
  topPublications: FastStatsPublicationWithStats[];
  recentPublications: FastStatsPublicationWithStats[];
  publicationsByYear: FastStatsYearCount[];
  publicationsBySection: FastStatsSectionCount[];
  
  // Citations (legacy)
  citations?: FastStatsCitationsResponse;
  
  // Unified Citations (v1.1.0.0 - includes Crossref + OpenAlex)
  allCitations?: AllCitationsResponse;
  topCitedPublications: UnifiedCitationItem[];
  
  // Meta
  lastUpdated: string;
  journals: FastStatsJournalStats[];
  selectedJournalId: number | null;
  selectedJournalPath: string | null;
  contextId: number | null;
}

/* ══════════════════════════════════════════════════════════════════
   API Functions
   ══════════════════════════════════════════════════════════════════ */

/**
 * Build Fast Stats API URL
 * Note: Fast Stats uses /{journal}/api/v1/fast-stats/ (no index.php)
 */
function buildFastStatsUrl(journalPath: string, endpoint: string, params?: URLSearchParams): string {
  const base = OJS_CONFIG.baseUrl || '';
  const queryString = params?.toString() ? `?${params.toString()}` : '';
  return `${base}/${journalPath}/api/v1/fast-stats/${endpoint}${queryString}`;
}

/**
 * Fetch with timeout and error handling
 */
async function fetchWithTimeout<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    console.log('[FastStats] Fetching:', url);
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('[FastStats] Response:', res.status, res.statusText);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('[FastStats] Error response:', text.substring(0, 300));
      throw new Error(`Fast Stats API error: ${res.status} ${res.statusText}`);
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await res.text();
      console.error('[FastStats] Non-JSON response:', text.substring(0, 300));
      throw new Error(`Expected JSON but got ${contentType}`);
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Fast Stats API request timeout');
    }
    throw error;
  }
}

/**
 * Fetch complete dashboard data in ONE API call
 * This is the main function to use - replaces 6+ separate API calls
 * 
 * @param journalPath - URL path of journal (e.g., 'tjpsd')
 * @param options.journalId - Optional: Override to fetch different journal's data
 * @param options.months - Timeline months (default: 12)
 */
export async function fetchFastStatsDashboard(
  journalPath: string,
  options?: { journalId?: number; months?: number; dateStart?: string; dateEnd?: string }
): Promise<FastStatsDashboardResponse> {
  const params = new URLSearchParams();
  if (options?.journalId) params.append('journalId', options.journalId.toString());
  if (options?.months) params.append('months', options.months.toString());
  if (options?.dateStart) params.append('dateStart', options.dateStart);
  if (options?.dateEnd) params.append('dateEnd', options.dateEnd);
  
  const url = buildFastStatsUrl(journalPath, 'dashboard', params);
  return fetchWithTimeout<FastStatsDashboardResponse>(url);
}

/**
 * Fetch citation statistics (legacy)
 */
export async function fetchFastStatsCitations(
  journalPath: string,
  journalId?: number
): Promise<FastStatsCitationsResponse> {
  const params = new URLSearchParams();
  if (journalId) params.append('journalId', journalId.toString());
  
  const url = buildFastStatsUrl(journalPath, 'citations', params);
  return fetchWithTimeout<FastStatsCitationsResponse>(url);
}

/**
 * Fetch Crossref citations data (v1.1.0.0)
 * Returns publications with citation counts from Crossref
 */
export async function fetchCrossrefCitations(
  journalPath: string,
  options?: {
    journalId?: number;
    count?: number;
    offset?: number;
    orderBy?: 'citation_count' | 'last_updated' | 'title' | 'date_published';
    orderDirection?: 'ASC' | 'DESC';
  }
): Promise<CrossrefCitationsResponse> {
  const params = new URLSearchParams();
  if (options?.journalId) params.append('journalId', options.journalId.toString());
  if (options?.count) params.append('count', options.count.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.orderBy) params.append('orderBy', options.orderBy);
  if (options?.orderDirection) params.append('orderDirection', options.orderDirection);
  
  const url = buildFastStatsUrl(journalPath, 'citations/crossref', params);
  return fetchWithTimeout<CrossrefCitationsResponse>(url);
}

/**
 * Fetch publications with DOIs
 */
export async function fetchPublicationsWithDOIs(
  journalPath: string,
  options?: {
    journalId?: number;
    count?: number;
    offset?: number;
    onlyMissing?: boolean;
  }
): Promise<PublicationsWithDOIsResponse> {
  const params = new URLSearchParams();
  if (options?.journalId) params.append('journalId', options.journalId.toString());
  if (options?.count) params.append('count', options.count.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.onlyMissing) params.append('onlyMissing', 'true');
  
  const url = buildFastStatsUrl(journalPath, 'citations/dois', params);
  return fetchWithTimeout<PublicationsWithDOIsResponse>(url);
}

/**
 * Trigger fetching of citations from Crossref (requires admin/manager role)
 */
export async function triggerCitationFetch(
  journalPath: string,
  options?: {
    onlyMissing?: boolean;
    limit?: number;
    email?: string;
    jwtToken?: string;
  }
): Promise<FetchCitationsResponse> {
  const params = new URLSearchParams();
  if (options?.onlyMissing !== undefined) params.append('onlyMissing', options.onlyMissing.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.email) params.append('email', options.email);
  
  const url = buildFastStatsUrl(journalPath, 'citations/fetch', params);
  
  // Use custom JWT token if provided, otherwise use default auth headers
  const headers = options?.jwtToken 
    ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.jwtToken}`,
      }
    : getAuthHeaders();
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Citation fetch failed: ${res.status} - ${text}`);
  }
  
  // Check if response is actually JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    // Extract meaningful error from HTML if possible
    const match = text.match(/<b>(.+?)<\/b>/);
    const errorMsg = match ? match[1] : text.substring(0, 200);
    throw new Error(`Server returned HTML instead of JSON. Error: ${errorMsg}`);
  }
  
  return res.json();
}

/**
 * Clear citation cache (requires site admin role)
 */
export async function clearCitationCache(
  journalPath: string,
  journalId?: number
): Promise<ClearCitationsResponse> {
  const params = new URLSearchParams();
  if (journalId) params.append('journalId', journalId.toString());
  
  const url = buildFastStatsUrl(journalPath, 'citations/clear', params);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clear cache failed: ${res.status} - ${text}`);
  }
  
  return res.json();
}

/**
 * Fetch publications without DOIs (v1.1.0.0)
 * These publications can use OpenAlex's title-based search
 */
export async function fetchPublicationsWithoutDOIs(
  journalPath: string,
  options?: {
    journalId?: number;
    count?: number;
    offset?: number;
    onlyMissing?: boolean;
  }
): Promise<PublicationsWithoutDOIsResponse> {
  const params = new URLSearchParams();
  if (options?.journalId) params.append('journalId', options.journalId.toString());
  if (options?.count) params.append('count', options.count.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.onlyMissing) params.append('onlyMissing', 'true');
  
  const url = buildFastStatsUrl(journalPath, 'citations/no-doi', params);
  return fetchWithTimeout<PublicationsWithoutDOIsResponse>(url);
}

/**
 * Fetch all citations unified view (v1.1.0.0)
 * Returns all publications with citations from any source (Crossref, OpenAlex)
 */
export async function fetchAllCitations(
  journalPath: string,
  options?: {
    journalId?: number;
    count?: number;
    offset?: number;
    orderBy?: 'citation_count' | 'last_updated' | 'title' | 'date_published';
    orderDirection?: 'ASC' | 'DESC';
  }
): Promise<AllCitationsResponse> {
  const params = new URLSearchParams();
  if (options?.journalId) params.append('journalId', options.journalId.toString());
  if (options?.count) params.append('count', options.count.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.orderBy) params.append('orderBy', options.orderBy);
  if (options?.orderDirection) params.append('orderDirection', options.orderDirection);
  
  const url = buildFastStatsUrl(journalPath, 'citations/all', params);
  return fetchWithTimeout<AllCitationsResponse>(url);
}

/**
 * Trigger fetching of citations from OpenAlex (v1.1.0.0)
 * Useful for publications without DOIs - uses title-based search
 */
export async function triggerOpenAlexFetch(
  journalPath: string,
  options?: {
    journalId?: number;
    limit?: number;
    onlyMissing?: boolean;
    email?: string;
    includeWithDoi?: boolean;
    jwtToken?: string;
  }
): Promise<FetchOpenAlexResponse> {
  const params = new URLSearchParams();
  if (options?.journalId) params.append('journalId', options.journalId.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.onlyMissing !== undefined) params.append('onlyMissing', options.onlyMissing.toString());
  if (options?.email) params.append('email', options.email);
  if (options?.includeWithDoi) params.append('includeWithDoi', 'true');
  
  const url = buildFastStatsUrl(journalPath, 'citations/fetch-openalex', params);
  
  // Use custom JWT token if provided, otherwise use default auth headers
  const headers = options?.jwtToken 
    ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.jwtToken}`,
      }
    : getAuthHeaders();
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAlex fetch failed: ${res.status} - ${text}`);
  }
  
  // Check if response is actually JSON
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    // Extract meaningful error from HTML if possible
    const match = text.match(/<b>(.+?)<\/b>/);
    const errorMsg = match ? match[1] : text.substring(0, 200);
    throw new Error(`Server returned HTML instead of JSON. Error: ${errorMsg}`);
  }
  
  return res.json();
}

/**
 * Fetch aggregated stats across ALL journals
 */
export async function fetchFastStatsAggregated(
  journalPath: string,
  options?: { dateStart?: string; dateEnd?: string }
): Promise<FastStatsAggregatedResponse> {
  const params = new URLSearchParams();
  if (options?.dateStart) params.append('dateStart', options.dateStart);
  if (options?.dateEnd) params.append('dateEnd', options.dateEnd);
  
  const url = buildFastStatsUrl(journalPath, 'aggregated', params);
  return fetchWithTimeout<FastStatsAggregatedResponse>(url);
}

/**
 * Fetch list of all journals with their stats
 */
export async function fetchFastStatsJournals(journalPath: string): Promise<FastStatsJournalStats[]> {
  const url = buildFastStatsUrl(journalPath, 'journals');
  const response = await fetchWithTimeout<{ items: FastStatsJournalStats[]; itemsMax: number } | FastStatsJournalStats[]>(url);
  // Handle both { items: [...] } and direct array format
  if (response && typeof response === 'object' && 'items' in response) {
    return response.items;
  }
  return Array.isArray(response) ? response : [];
}

/**
 * Fetch views timeline with configurable interval
 */
export async function fetchFastStatsTimeline(
  journalPath: string,
  options?: { 
    months?: number; 
    timelineInterval?: 'day' | 'month' | 'year';
    dateStart?: string;
    dateEnd?: string;
  }
): Promise<FastStatsTimelineEntry[]> {
  const params = new URLSearchParams();
  if (options?.months) params.append('months', options.months.toString());
  if (options?.timelineInterval) params.append('timelineInterval', options.timelineInterval);
  if (options?.dateStart) params.append('dateStart', options.dateStart);
  if (options?.dateEnd) params.append('dateEnd', options.dateEnd);
  
  const url = buildFastStatsUrl(journalPath, 'views/timeline', params);
  return fetchWithTimeout<FastStatsTimelineEntry[]>(url);
}

/**
 * Fetch top publications by views
 */
export async function fetchFastStatsTopPublications(
  journalPath: string,
  options?: { count?: number; dateStart?: string; dateEnd?: string }
): Promise<FastStatsPublicationWithStats[]> {
  const params = new URLSearchParams();
  if (options?.count) params.append('count', options.count.toString());
  if (options?.dateStart) params.append('dateStart', options.dateStart);
  if (options?.dateEnd) params.append('dateEnd', options.dateEnd);
  
  const url = buildFastStatsUrl(journalPath, 'publications/top', params);
  return fetchWithTimeout<FastStatsPublicationWithStats[]>(url);
}

/**
 * Fetch recent publications
 */
export async function fetchFastStatsRecentPublications(
  journalPath: string,
  options?: { count?: number }
): Promise<FastStatsPublicationWithStats[]> {
  const params = new URLSearchParams();
  if (options?.count) params.append('count', options.count.toString());
  
  const url = buildFastStatsUrl(journalPath, 'publications/recent', params);
  return fetchWithTimeout<FastStatsPublicationWithStats[]>(url);
}

/**
 * Fetch real-time polling statistics (updates every 2 seconds)
 * This endpoint returns live download counts that update immediately
 * 
 * @param journalPath - URL path of journal (e.g., 'tjpsd')
 * @param contextId - Optional context ID filter
 */
export async function fetchStatsPolling(
  journalPath: string,
  contextId?: number
): Promise<StatsPollingResponse> {
  const params = new URLSearchParams();
  if (contextId) params.append('contextId', contextId.toString());
  
  const url = buildFastStatsUrl(journalPath, 'stats/poll', params);
  return fetchWithTimeout<StatsPollingResponse>(url, 5000); // Shorter timeout for polling
}

/* ══════════════════════════════════════════════════════════════════
   Main Function: Fetch Unified Dashboard Metrics
   ══════════════════════════════════════════════════════════════════ */

/**
 * Fetch all dashboard metrics using Fast Stats API
 * 
 * @param selectedJournalId - Optional journal ID to filter by (from journal selector)
 *                           null = use default journal from config
 */
export async function fetchUnifiedDashboardMetrics(
  selectedJournalId: number | null = null
): Promise<UnifiedDashboardMetrics> {
  const configuredJournals = OJS_CONFIG.journals;
  const defaultJournalPath = configuredJournals[0]?.urlPath || 'tjpsd';
  
  console.log('[FastStats] Fetching unified metrics, journalId:', selectedJournalId);
  
  // Try to get journals list first
  let journalsList: FastStatsJournalStats[] = [];
  try {
    const fetched = await fetchFastStatsJournals(defaultJournalPath);
    journalsList = Array.isArray(fetched) ? fetched : [];
  } catch {
    // Fallback to configured journals if API fails
    journalsList = configuredJournals.map((j, idx) => ({
      id: idx + 1,
      path: j.urlPath,
      name: j.name,
      abbreviation: j.urlPath.toUpperCase(),
      description: '',
      enabled: true,
      totalSubmissions: 0,
      publishedArticles: 0,
      activeSubmissions: 0,
      publishedIssues: 0,
    }));
  }
  
  // If no journal is selected, aggregate data from all journals
  if (!selectedJournalId && journalsList.length > 0) {
    console.log('[FastStats] Aggregating data from all journals:', journalsList.map(j => `${j.name} (ID: ${j.id})`));
    
    // Fetch dashboard data from each journal with their specific journalId
    const dashboardPromises = journalsList.map(journal => 
      fetchFastStatsDashboard(journal.path, { journalId: journal.id, months: 12 })
        .catch(err => {
          console.warn(`[FastStats] Failed to fetch dashboard for ${journal.path} (ID: ${journal.id}):`, err);
          return null;
        })
    );
    const dashboards = (await Promise.all(dashboardPromises)).filter(d => d !== null) as FastStatsDashboardResponse[];
    
    console.log('[FastStats] Successfully fetched dashboards from', dashboards.length, 'journals');
    
    // Log individual journal metrics for debugging
    dashboards.forEach((dashboard, idx) => {
      console.log(`[FastStats] Journal ${idx + 1} metrics:`, {
        submissions: dashboard.counts?.totalSubmissions || 0,
        publications: dashboard.counts?.publishedArticles || 0,
        downloads: dashboard.downloads?.fileDownloads || 0,
      });
    });
    
    // Aggregate metrics
    const aggregated = dashboards.reduce((acc, dashboard) => ({
      totalDownloads: acc.totalDownloads + (dashboard.downloads?.fileDownloads || 0),
      totalAbstractViews: acc.totalAbstractViews + (dashboard.downloads?.abstractViews || 0),
      totalViews: acc.totalViews + (dashboard.downloads?.totalViews || 0),
      totalPublications: acc.totalPublications + (dashboard.counts?.publishedArticles || 0),
      totalUsers: acc.totalUsers + (dashboard.users?.totalUsers || 0),
      totalSubmissions: acc.totalSubmissions + (dashboard.counts?.totalSubmissions || 0),
      submissionsReceived: acc.submissionsReceived + (dashboard.editorial?.submissionsReceived || 0),
      submissionsAccepted: acc.submissionsAccepted + (dashboard.editorial?.submissionsPublished || 0),
      submissionsDeclined: acc.submissionsDeclined + (dashboard.editorial?.submissionsDeclined || 0),
      submissionsQueued: acc.submissionsQueued + (dashboard.editorial?.submissionsQueued || 0),
      submissionsScheduled: acc.submissionsScheduled + (dashboard.editorial?.submissionsScheduled || 0),
      activeSubmissions: acc.activeSubmissions + (dashboard.counts?.activeSubmissions || 0),
      totalIssues: acc.totalIssues + (dashboard.counts?.totalIssues || 0),
      publishedIssues: acc.publishedIssues + (dashboard.counts?.publishedIssues || 0),
    }), {
      totalDownloads: 0,
      totalAbstractViews: 0,
      totalViews: 0,
      totalPublications: 0,
      totalUsers: 0,
      totalSubmissions: 0,
      submissionsReceived: 0,
      submissionsAccepted: 0,
      submissionsDeclined: 0,
      submissionsQueued: 0,
      submissionsScheduled: 0,
      activeSubmissions: 0,
      totalIssues: 0,
      publishedIssues: 0,
    });
    
    // Log aggregated totals for debugging
    console.log('[FastStats] Aggregated totals:', {
      totalSubmissions: aggregated.totalSubmissions,
      totalPublications: aggregated.totalPublications,
      totalDownloads: aggregated.totalDownloads,
      submissionsReceived: aggregated.submissionsReceived,
    });
    
    // Calculate acceptance and rejection rates
    const acceptanceRate = aggregated.submissionsReceived > 0 
      ? (aggregated.submissionsAccepted / aggregated.submissionsReceived) * 100 
      : 0;
    const rejectionRate = aggregated.submissionsReceived > 0 
      ? (aggregated.submissionsDeclined / aggregated.submissionsReceived) * 100 
      : 0;
    
    // Aggregate citation data from all journals
    let allCitations: AllCitationsResponse | undefined;
    let topCitedPublications: UnifiedCitationItem[] = [];
    try {
      const citationPromises = journalsList.map(journal => 
        fetchAllCitations(journal.path, {
          journalId: journal.id,
          count: 100,
          orderBy: 'citation_count',
          orderDirection: 'DESC',
        }).catch(err => {
          console.warn(`[FastStats] Failed to fetch citations for ${journal.path} (ID: ${journal.id}):`, err);
          return null;
        })
      );
      const citationResults = (await Promise.all(citationPromises)).filter(c => c !== null) as AllCitationsResponse[];
      
      if (citationResults.length > 0) {
        // Combine all citation data
        const allItems: UnifiedCitationItem[] = citationResults.flatMap(r => r.items || []);
        const totalCitations = citationResults.reduce((sum, r) => sum + (r.summary?.totalCitations || 0), 0);
        const publicationsWithCitations = citationResults.reduce((sum, r) => sum + (r.summary?.publicationsWithCitations || 0), 0);
        const totalPublications = citationResults.reduce((sum, r) => sum + (r.summary?.totalPublications || 0), 0);
        const fromCrossref = citationResults.reduce((sum, r) => sum + (r.summary?.fromCrossref || 0), 0);
        const fromOpenalex = citationResults.reduce((sum, r) => sum + (r.summary?.fromOpenalex || 0), 0);
        const maxCitations = Math.max(...citationResults.map(r => r.summary?.maxCitations || 0));
        const avgCitations = totalPublications > 0 ? totalCitations / totalPublications : 0;
        
        allCitations = {
          items: allItems.sort((a, b) => b.citationCount - a.citationCount),
          itemsMax: allItems.length,
          summary: {
            totalCitations,
            publicationsWithCitations,
            totalPublications,
            maxCitations,
            avgCitations,
            fromCrossref,
            fromOpenalex,
          },
          contextId: null,
        };
        
        topCitedPublications = allItems
          .filter(item => item.citationCount > 0)
          .sort((a, b) => b.citationCount - a.citationCount)
          .slice(0, 10);
      }
    } catch (err) {
      console.log('[FastStats] Unified citations not available:', err);
    }
    
    // Aggregate arrays (combine and deduplicate where appropriate)
    const allUsersByRole: FastStatsRoleCount[] = [];
    const allTimeline: FastStatsTimelineEntry[] = [];
    const allTopPublications: FastStatsPublicationWithStats[] = [];
    const allRecentPublications: FastStatsPublicationWithStats[] = [];
    const allPublicationsByYear: FastStatsYearCount[] = [];
    const allPublicationsBySection: FastStatsSectionCount[] = [];
    
    dashboards.forEach(dashboard => {
      if (dashboard.users?.byRole) allUsersByRole.push(...dashboard.users.byRole);
      if (dashboard.viewsTimeline) allTimeline.push(...dashboard.viewsTimeline);
      if (dashboard.topPublications) allTopPublications.push(...dashboard.topPublications);
      if (dashboard.recentPublications) allRecentPublications.push(...dashboard.recentPublications);
      if (dashboard.publicationsByYear) allPublicationsByYear.push(...dashboard.publicationsByYear);
      if (dashboard.publicationsBySection) allPublicationsBySection.push(...dashboard.publicationsBySection);
    });
    
    return {
      ...aggregated,
      acceptanceRate,
      rejectionRate,
      usersByRole: allUsersByRole,
      viewsTimeline: allTimeline,
      topPublications: allTopPublications.sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0)).slice(0, 10),
      recentPublications: allRecentPublications.sort((a, b) => 
        new Date(b.datePublished || 0).getTime() - new Date(a.datePublished || 0).getTime()
      ).slice(0, 10),
      publicationsByYear: allPublicationsByYear,
      publicationsBySection: allPublicationsBySection,
      citations: undefined,
      allCitations,
      topCitedPublications,
      lastUpdated: new Date().toISOString(),
      journals: journalsList,
      selectedJournalId: null,
      selectedJournalPath: null,
      contextId: null,
    };
  }
  
  // Single journal selected - fetch data for that specific journal
  const selectedJournal = journalsList.find(j => j.id === selectedJournalId);
  const journalPath = selectedJournal?.path || defaultJournalPath;
  
  const dashboard = await fetchFastStatsDashboard(journalPath, { 
    journalId: selectedJournalId || undefined,
    months: 12 
  });
  
  // Get context ID from response
  const contextId = dashboard.counts?.contextId || dashboard.filters?.contextId || null;
  
  // Try to get citations (legacy)
  let citations: FastStatsCitationsResponse | undefined;
  try {
    citations = await fetchFastStatsCitations(journalPath, selectedJournalId || undefined);
  } catch {
    citations = undefined;
  }
  
  // Try to get unified citations (v1.1.0.0 - Crossref + OpenAlex)
  let allCitations: AllCitationsResponse | undefined;
  let topCitedPublications: UnifiedCitationItem[] = [];
  try {
    allCitations = await fetchAllCitations(journalPath, {
      journalId: selectedJournalId || undefined,
      count: 100,
      orderBy: 'citation_count',
      orderDirection: 'DESC',
    });
    // Get top 10 cited publications
    topCitedPublications = (allCitations.items || [])
      .filter(item => item.citationCount > 0)
      .slice(0, 10);
  } catch (err) {
    console.log('[FastStats] Unified citations not available:', err);
    allCitations = undefined;
  }
  
  // Find selected journal path from journals list
  const selectedJournalPath = selectedJournalId 
    ? journalsList.find(j => j.id === selectedJournalId)?.path || null
    : null;
  
  return {
    // Key metrics
    totalDownloads: dashboard.downloads?.fileDownloads || 0,
    totalAbstractViews: dashboard.downloads?.abstractViews || 0,
    totalViews: dashboard.downloads?.totalViews || 0,
    totalPublications: dashboard.counts?.publishedArticles || 0,
    totalUsers: dashboard.users?.totalUsers || 0,
    totalSubmissions: dashboard.counts?.totalSubmissions || 0,
    
    // Editorial
    submissionsReceived: dashboard.editorial?.submissionsReceived || 0,
    submissionsAccepted: dashboard.editorial?.submissionsPublished || 0,
    submissionsDeclined: dashboard.editorial?.submissionsDeclined || 0,
    submissionsQueued: dashboard.editorial?.submissionsQueued || 0,
    submissionsScheduled: dashboard.editorial?.submissionsScheduled || 0,
    activeSubmissions: dashboard.counts?.activeSubmissions || 0,
    acceptanceRate: dashboard.editorial?.acceptanceRate || 0,
    rejectionRate: dashboard.editorial?.rejectionRate || 0,
    
    // Counts
    totalIssues: dashboard.counts?.totalIssues || 0,
    publishedIssues: dashboard.counts?.publishedIssues || 0,
    
    // Detailed data - ensure arrays
    usersByRole: Array.isArray(dashboard.users?.byRole) ? dashboard.users.byRole : [],
    viewsTimeline: Array.isArray(dashboard.viewsTimeline) ? dashboard.viewsTimeline : [],
    topPublications: Array.isArray(dashboard.topPublications) ? dashboard.topPublications : [],
    recentPublications: Array.isArray(dashboard.recentPublications) ? dashboard.recentPublications : [],
    publicationsByYear: Array.isArray(dashboard.publicationsByYear) ? dashboard.publicationsByYear : [],
    publicationsBySection: Array.isArray(dashboard.publicationsBySection) ? dashboard.publicationsBySection : [],
    
    // Citations (legacy)
    citations,
    
    // Unified Citations (v1.1.0.0 - Crossref + OpenAlex)
    allCitations,
    topCitedPublications,
    
    // Meta
    lastUpdated: dashboard.lastUpdated || new Date().toISOString(),
    journals: journalsList,
    selectedJournalId,
    selectedJournalPath,
    contextId,
  };
}

/**
 * Test Fast Stats API connection
 */
export async function testFastStatsConnection(journalPath: string): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const url = buildFastStatsUrl(journalPath, 'counts');
    await fetchWithTimeout<FastStatsCountsResponse>(url, 5000);
    return { connected: true, message: 'Fast Stats API connected successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FastStats] Connection test failed:', message);
    return { connected: false, message: `Fast Stats API not available: ${message}` };
  }
}
