/**
 * OJS Plugin Configuration Helper
 * 
 * Reads configuration from window.UDSM_INSIGHTS_CONFIG when running
 * as an OJS plugin, or falls back to environment/default values.
 */

// Type definition for OJS plugin config
export interface OjsPluginConfig {
  settings: {
    matomoUrl?: string;
    matomoSiteId?: string;
    matomoToken?: string;
    fastStatsApiUrl?: string;
    jwtToken?: string;
    enableRealtime?: boolean;
    refreshInterval?: number;
  };
  journalPath?: string;
  journalId?: number;
  journalName?: string;
  baseUrl?: string;
  assetsUrl?: string;
  embedded?: boolean;
}

// Declare global window property
declare global {
  interface Window {
    UDSM_INSIGHTS_CONFIG?: OjsPluginConfig;
  }
}

/**
 * Check if running inside OJS plugin
 */
export function isOjsPlugin(): boolean {
  return typeof window !== 'undefined' && !!window.UDSM_INSIGHTS_CONFIG;
}

/**
 * Get the full OJS plugin config
 */
export function getOjsPluginConfig(): OjsPluginConfig | null {
  if (typeof window !== 'undefined' && window.UDSM_INSIGHTS_CONFIG) {
    // Parse settings if it's a string (from PHP json_encode)
    const config = window.UDSM_INSIGHTS_CONFIG;
    if (typeof config.settings === 'string') {
      try {
        config.settings = JSON.parse(config.settings);
      } catch (e) {
        console.error('Failed to parse UDSM_INSIGHTS_CONFIG.settings:', e);
      }
    }
    return config;
  }
  return null;
}

/**
 * Get Matomo configuration, preferring OJS plugin settings
 */
export function getMatomoConfig() {
  const ojsConfig = getOjsPluginConfig();
  
  if (ojsConfig?.settings?.matomoUrl) {
    return {
      baseUrl: ojsConfig.settings.matomoUrl,
      siteId: parseInt(ojsConfig.settings.matomoSiteId || '1', 10),
      authToken: ojsConfig.settings.matomoToken || '',
    };
  }
  
  // Fallback to default/dev values
  return {
    baseUrl: import.meta.env.DEV ? '/matomo-api' : 'https://matomo.themenumanager.xyz',
    siteId: 2,
    authToken: 'e2b59861553c6f5d60e724d049da1bf7',
  };
}

/**
 * Get Fast Stats API configuration, preferring OJS plugin settings
 */
export function getFastStatsConfig() {
  const ojsConfig = getOjsPluginConfig();
  
  if (ojsConfig?.settings?.fastStatsApiUrl) {
    return {
      baseUrl: ojsConfig.settings.fastStatsApiUrl,
      jwtToken: ojsConfig.settings.jwtToken || '',
    };
  }
  
  // Fallback: use same-origin OJS installation
  return {
    baseUrl: '',  // empty = same origin
    jwtToken: '',
  };
}

/**
 * Get the current journal path
 */
export function getJournalPath(): string {
  const ojsConfig = getOjsPluginConfig();
  return ojsConfig?.journalPath || 'tjpsd';
}

/**
 * Get refresh interval from settings
 */
export function getRefreshInterval(): number {
  const ojsConfig = getOjsPluginConfig();
  return (ojsConfig?.settings?.refreshInterval || 60) * 1000; // Convert to ms
}

/**
 * Check if real-time tracking is enabled
 */
export function isRealtimeEnabled(): boolean {
  const ojsConfig = getOjsPluginConfig();
  // Default to true if not specified
  return ojsConfig?.settings?.enableRealtime !== false;
}

/**
 * Check if running in embedded mode (iframe)
 */
export function isEmbedded(): boolean {
  const ojsConfig = getOjsPluginConfig();
  return ojsConfig?.embedded === true;
}
