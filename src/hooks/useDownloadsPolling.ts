/**
 * Real-Time Downloads Polling Hook
 * 
 * Polls the Fast Stats API every 2 seconds for live download statistics.
 * Updates immediately when downloads occur.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStatsPolling, type StatsPollingResponse } from '@/services/fastStatsApi';
import { getJournalPath } from '@/config/pluginConfig';

export interface DownloadsPollingData {
  todayDownloads: number;
  totalDownloads: number;
  yearDownloads: number;
  totalPapers: number;
  timestamp: number;
  realtime: true;
}

export interface DownloadsPollingState {
  data: DownloadsPollingData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isPolling: boolean;
}

/**
 * Hook to poll download statistics in real-time
 * @param intervalMs - Polling interval in milliseconds (default: 2000ms / 2 seconds)
 * @param contextId - Optional context ID to filter by journal
 * @param enabled - Whether polling is enabled (default: true)
 */
export function useDownloadsPolling(
  intervalMs: number = 2000,
  contextId?: number,
  enabled: boolean = true
): DownloadsPollingState {
  const [state, setState] = useState<DownloadsPollingState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isPolling: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const journalPath = getJournalPath();

  // Fetch function
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      const result = await fetchStatsPolling(journalPath, contextId);
      
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isPolling: true,
      }));
    } catch (error) {
      console.error('[DownloadsPolling] Error fetching stats:', error);
      
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isPolling: false,
      }));
    }
  }, [enabled, journalPath, contextId]);

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      // Clear polling if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setState(prev => ({ ...prev, isPolling: false }));
      return;
    }

    // Initial fetch
    fetchData();

    // Start polling
    intervalRef.current = setInterval(fetchData, intervalMs);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, fetchData]);

  return state;
}

/**
 * Hook to detect when downloads change (for animations)
 * Returns the previous value and current value
 */
export function useDownloadsChangeDetector(currentValue: number | undefined) {
  const previousValueRef = useRef<number | undefined>(undefined);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (currentValue !== undefined && previousValueRef.current !== undefined) {
      if (currentValue !== previousValueRef.current) {
        setHasChanged(true);
        
        // Reset after animation duration
        const timeout = setTimeout(() => setHasChanged(false), 1000);
        return () => clearTimeout(timeout);
      }
    }
    
    previousValueRef.current = currentValue;
  }, [currentValue]);

  return {
    previousValue: previousValueRef.current,
    currentValue,
    hasChanged,
  };
}
