import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StatItem, StatsResponse } from '../utils/dashboard-utils';
import { authClient } from '@/lib/auth-client';
import { useCategoryStore } from './category-store'; // Import category store

// ... interface remains the same ...
interface DashboardState {
    hourlyData: Record<number, StatItem[]>;
    dailyStats: StatItem[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    hideBrowsers: boolean;
    selectedHour: number;
    lastFetchTimestamp: string | null;

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
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            // ... (keep state initializers)
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
                    const { shouldClearCache, mergeHourlyData, mergeAppStats, findLatestTimestamp } = await import('../utils/stats-merge');

                    let since = lastFetchTimestamp;
                    if (shouldClearCache(lastFetchTimestamp)) {
                        console.log('[DashboardStore] Clearing cache due to date change');
                        since = null;
                        setLastFetchTimestamp(null);
                    }

                    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
                    const params = new URLSearchParams({
                        timeZone: timeZone || 'UTC',
                        groupBy: 'hour'
                    });

                    if (since) params.append('since', since);

                    const url = `${baseUrl}/api/stats?${params.toString()}`;
                    console.log('[DashboardStore] Fetching stats:', url, 'Since:', since);

                    // Try to get session token to enable Authorization header (workaround for 3rd party cookie issues)
                    const headers: HeadersInit = {};
                    try {
                        const session = await authClient.getSession();
                        // @ts-ignore - better-auth types might not expose token directly on session object depending on version, 
                        // but often it's in session.token or we can rely on cookies. 
                        // However, the user specifically asked for Authorization header.
                        // If authClient uses local storage, we might be able to grab it.
                        // For now, let's try to add it if we can find it, otherwise rely on cookies.
                        // Actually, better-auth usually stores in localStorage under 'better-auth.session_token' or similar if configured.
                        // Let's check `authClient` capabilities. It doesn't seem to expose `getToken`.
                        // We will implement a best-effort: check if session exists.
                        if (session?.data?.session) {
                            // If the token is available in the session object
                            // @ts-ignore
                            const token = session.data.session.token || session.data.token;
                            if (token) {
                                headers['Authorization'] = `Bearer ${token}`;
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to get session for header', e);
                    }

                    const res = await fetch(url, {
                        credentials: 'include',
                        headers
                    });

                    if (res.status === 401) {
                        if (onUnauthorized) onUnauthorized();
                        else await authClient.signOut();
                        return;
                    }

                    if (!res.ok) throw new Error('Failed to fetch stats');

                    const json: StatsResponse = await res.json();
                    if (json.success) {
                        if ('hourly' in json.data && 'daily' in json.data) {
                            const newHourly = json.data.hourly || {};
                            const newDaily = json.data.daily || [];

                            if (since) {
                                console.log('[DashboardStore] Merging incremental stats. Cached Hours:', Object.keys(cachedHourly));
                                const mergedHourly = mergeHourlyData(cachedHourly, newHourly);
                                const mergedDaily = mergeAppStats(cachedDaily, newDaily);
                                setHourlyData(mergedHourly);
                                setDailyStats(mergedDaily);
                            } else {
                                console.log('[DashboardStore] Full fetch (no since). Replacing data.');
                                setHourlyData(newHourly);
                                setDailyStats(newDaily);
                            }

                            const latestTimestamp = findLatestTimestamp(json.data);
                            if (latestTimestamp) setLastFetchTimestamp(latestTimestamp);
                        } else {
                            setHourlyData((json.data as any) || {});
                            setDailyStats([]);
                        }

                        // Sync Category Store
                        const categoryStore = useCategoryStore.getState();
                        const newCategoryMap = { ...categoryStore.categoryMap };
                        // Populate from dailyStats
                        const allStats = [...(json.data.daily || [])];
                        // Also hourly? usually daily covers all apps.
                        if (json.data.hourly) {
                            Object.values(json.data.hourly).forEach(arr => allStats.push(...arr));
                        }

                        allStats.forEach(item => {
                            if (item.appId && !newCategoryMap[item.appId]) {
                                newCategoryMap[item.appId] = {
                                    category: item.category,
                                    autoSuggested: item.autoSuggested
                                };
                            }
                        });
                        categoryStore.setCategoryMap(newCategoryMap);

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



        }
        ),
        {
            name: 'dashboard-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                hourlyData: state.hourlyData,
                dailyStats: state.dailyStats,
                hideBrowsers: state.hideBrowsers,
                selectedHour: state.selectedHour,
                lastFetchTimestamp: state.lastFetchTimestamp,
            }),
        }
    ));


