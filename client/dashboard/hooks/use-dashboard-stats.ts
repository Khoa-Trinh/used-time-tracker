'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api-client';
import { StatItem, StatsResponse, ApiStatsResponse } from '../utils/dashboard-utils';

export function useDashboardStats() {
    const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const queryClient = useQueryClient();
    const queryKey = ['dashboard-stats', 'today', timeZone];

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            // 1. Get current cache to find 'since' and 'apps'
            const cachedData = queryClient.getQueryData<StatsResponse['data']>(queryKey);
            const cachedApps = cachedData?.apps || {};
            const knownAppIds = Object.keys(cachedApps);

            // Check if we need to clear cache (new day)
            let since = null;
            const { shouldClearCache, mergeHourlyData, mergeAppStats, mergeApps } = await import('../utils/stats-merge');

            const lastFetch = cachedData?._lastFetch || null;

            if (lastFetch && !shouldClearCache(lastFetch)) {
                since = lastFetch;
            } else if (lastFetch) {
                // console.log('[DashboardStats] Clearing cache due to date change');
            }

            // console.log(`[DashboardStats] Fetching. Since: ${since}, Known Apps: ${knownAppIds.length}`);

            const { data, error } = await client.api.stats.post({
                knownAppIds
            }, {
                query: {
                    timeZone,
                    groupBy: 'hour',
                    since: since || undefined
                }
            });

            if (error) throw error;
            if (!data || !data.success || !data.data) throw new Error('Invalid data response');

            // Hydrate normalized data to full objects
            const apiData = data.data as unknown as ApiStatsResponse['data'];

            // Merge new apps with cached apps
            const apps = mergeApps(cachedApps, apiData.apps);

            const hydratedHourly: Record<number, StatItem[]> = {};
            Object.keys(apiData.hourly).forEach(k => {
                const hour = parseInt(k);
                const items = apiData.hourly[hour] || [];
                hydratedHourly[hour] = items.map(item => {
                    const meta = apps[item.appId] || { appName: 'Unknown', category: 'uncategorized', platforms: [], autoSuggested: false };
                    // Calculate totalTimeMs from timelines
                    const totalTimeMs = item.timelines.reduce((sum, t) => sum + (new Date(t.endTime).getTime() - new Date(t.startTime).getTime()), 0);
                    return {
                        ...meta,
                        appId: item.appId,
                        timelines: item.timelines,
                        totalTimeMs
                    };
                }).sort((a, b) => b.totalTimeMs - a.totalTimeMs);
            });

            const hydratedDaily: StatItem[] = (apiData.daily || []).map(item => {
                const meta = apps[item.appId] || { appName: 'Unknown', category: 'uncategorized', platforms: [], autoSuggested: false };
                return {
                    ...meta,
                    appId: item.appId,
                    timelines: [], // Daily stats don't carry timelines in this optimization
                    totalTimeMs: item.totalTimeMs
                };
            });

            const incoming = {
                apps,
                hourly: hydratedHourly,
                daily: hydratedDaily
            };

            let result = incoming;

            // 2. Merge if we had a partial fetch and exist cache
            if (since && cachedData) {
                // console.log('[DashboardStats] Merging incremental update.');
                const mergedHourly = mergeHourlyData(cachedData.hourly || {}, incoming.hourly);
                const mergedDaily = mergeAppStats(cachedData.daily || [], incoming.daily);

                result = {
                    ...cachedData,
                    apps, // Always use the latest merged apps
                    hourly: mergedHourly,
                    daily: mergedDaily
                };
            }

            // 3. Update Timestamp
            (result as any)._lastFetch = new Date().toISOString();

            return result;
        },
        // Refetch every minute to keep data fresh
        refetchInterval: 60 * 1000,
        retry: 1,
        // Important: Keep previous data while fetching to avoid flicker
        placeholderData: (previousData: any) => previousData,
    });

    const fallbackStats: StatsResponse['data'] = {
        apps: {},
        hourly: {},
        daily: []
    };


    return {
        ...query,
        stats: query.data || fallbackStats
    };
}
