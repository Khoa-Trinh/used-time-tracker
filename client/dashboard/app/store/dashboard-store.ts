import { create } from 'zustand';
import { StatItem, StatsResponse } from '../utils/dashboard-utils';
import { authClient } from '@/lib/auth-client';

interface DashboardState {
    hourlyData: Record<number, StatItem[]>;
    dailyStats: StatItem[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    hideBrowsers: boolean;
    selectedHour: number;
    lastFetchTimestamp: string | null; // Track latest data timestamp for incremental loading

    // Actions
    setHourlyData: (data: Record<number, StatItem[]>) => void;
    setDailyStats: (data: StatItem[]) => void;
    setLoading: (loading: boolean) => void;
    setRefreshing: (refreshing: boolean) => void;
    setError: (error: string | null) => void;
    setHideBrowsers: (hide: boolean) => void;
    setSelectedHour: (hour: number) => void;
    setLastFetchTimestamp: (timestamp: string | null) => void;

    // Complex Actions
    fetchStats: (onUnauthorized?: () => void) => Promise<void>;
    updateCategory: (appId: string, category: string, previousCategory: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    hourlyData: {},
    dailyStats: [],
    loading: true,
    refreshing: false,
    error: null,
    hideBrowsers: true,
    selectedHour: new Date().getHours(),
    lastFetchTimestamp: null,

    setHourlyData: (data) => set({ hourlyData: data }),
    setDailyStats: (data) => set({ dailyStats: data }),
    setLoading: (loading) => set({ loading }),
    setRefreshing: (refreshing) => set({ refreshing }),
    setError: (error) => set({ error }),
    setHideBrowsers: (hideBrowsers) => set({ hideBrowsers }),
    setSelectedHour: (selectedHour) => set({ selectedHour }),
    setLastFetchTimestamp: (lastFetchTimestamp) => set({ lastFetchTimestamp }),

    fetchStats: async (onUnauthorized) => {
        const {
            setLoading,
            setRefreshing,
            setError,
            setHourlyData,
            setDailyStats,
            setLastFetchTimestamp,
            hourlyData: cachedHourly,
            dailyStats: cachedDaily,
            lastFetchTimestamp
        } = get();

        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Check if we should clear cache (date changed)
            const { shouldClearCache, mergeHourlyData, mergeAppStats, findLatestTimestamp } = await import('./stats-merge');

            let since = lastFetchTimestamp;
            if (shouldClearCache(lastFetchTimestamp)) {
                // Clear cache on new day
                since = null;
                setLastFetchTimestamp(null);
            }

            // Build URL with optional 'since' parameter
            let url = `/api/stats?timeZone=${timeZone}&groupBy=hour`;
            if (since) {
                url += `&since=${encodeURIComponent(since)}`;
            }

            const res = await fetch(url, {
                credentials: 'include'
            });

            if (res.status === 401) {
                if (onUnauthorized) onUnauthorized();
                else await authClient.signOut(); // Fallback if no callback
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch stats');

            const json: StatsResponse = await res.json();
            if (json.success) {
                // Ensure we got the new structure
                if ('hourly' in json.data && 'daily' in json.data) {
                    const newHourly = json.data.hourly || {};
                    const newDaily = json.data.daily || [];

                    // If this is incremental (has 'since'), merge with cached data
                    if (since) {
                        const mergedHourly = mergeHourlyData(cachedHourly, newHourly);
                        const mergedDaily = mergeAppStats(cachedDaily, newDaily);

                        setHourlyData(mergedHourly);
                        setDailyStats(mergedDaily);
                    } else {
                        // Full fetch, use new data directly
                        setHourlyData(newHourly);
                        setDailyStats(newDaily);
                    }

                    // Update last fetch timestamp
                    const latestTimestamp = findLatestTimestamp(json.data);
                    if (latestTimestamp) {
                        setLastFetchTimestamp(latestTimestamp);
                    }
                } else {
                    // Fallback for unexpected response (or legacy)
                    setHourlyData((json.data as any) || {});
                    setDailyStats([]);
                }
                setError(null);
            } else {
                throw new Error('API returned failure');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    },

    updateCategory: (appId, category, previousCategory) => {
        const uniqueId = Math.random().toString(36).substr(2, 5);
        // console.log(`[UpdateCateg   ory:${uniqueId}] Queued update...`);

        // Defer ENTIRE update to next tick to unblock Main Thread immediately (INP Fix)
        setTimeout(async () => {
            // console.log(`[UpdateCategory:${uniqueId}] Processing started`);
            const startTotal = performance.now();
            const { hourlyData, dailyStats } = get();

            // Optimistic Update Helpers
            const updateHourly = (prev: Record<number, StatItem[]>, cat: string) => {
                const next = { ...prev };
                let hasChanges = false;
                Object.keys(next).forEach(keyStr => {
                    const numKey = parseInt(keyStr);
                    const list = next[numKey];
                    const index = list.findIndex(item => item.appId === appId);
                    if (index !== -1) {
                        if (list[index].category !== cat) {
                            const newList = [...list];
                            newList[index] = { ...list[index], category: cat as any };
                            next[numKey] = newList;
                            hasChanges = true;
                        }
                    }
                });
                return hasChanges ? next : prev;
            };

            const updateDaily = (prev: StatItem[], cat: string) => {
                const index = prev.findIndex(item => item.appId === appId);
                if (index !== -1 && prev[index].category !== cat) {
                    const newList = [...prev];
                    newList[index] = { ...prev[index], category: cat as any };
                    return newList;
                }
                return prev;
            };

            // 1. Instant UI update (Batched)
            const calcStart = performance.now();
            const newHourly = updateHourly(hourlyData, category);
            const newDaily = updateDaily(dailyStats, category);
            // console.log(`[UpdateCategory:${uniqueId}] Optimistic calculation took ${(performance.now() - calcStart).toFixed(2)}ms`);

            if (newHourly !== hourlyData || newDaily !== dailyStats) {
                // console.log(`[UpdateCategory:${uniqueId}] Applying optimistic state update`);
                set({ hourlyData: newHourly, dailyStats: newDaily });
            } else {
                // console.log(`[UpdateCategory:${uniqueId}] No local changes detected.`);
            }

            // 2. Background API Call
            // console.log(`[UpdateCategory:${uniqueId}] Sending API request...`);
            try {
                const res = await fetch(`/api/apps/${appId}/category`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category }),
                    credentials: 'include'
                });

                if (!res.ok) {
                    throw new Error(`Failed to update category: ${res.status}`);
                }
                // console.log(`[UpdateCategory:${uniqueId}] API success took ${(performance.now() - startTotal).toFixed(2)}ms`);
            } catch (err) {
                // console.error(`[UpdateCategory:${uniqueId}] API failed`, err);
                // Revert on failure
                // console.log(`[UpdateCategory:${uniqueId}] Reverting state`);
                const current = get();
                set({
                    hourlyData: updateHourly(current.hourlyData, previousCategory),
                    dailyStats: updateDaily(current.dailyStats, previousCategory)
                });
            }
        }, 0);
    }
}));
