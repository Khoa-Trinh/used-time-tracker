'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api-client';
import { mergeApps, mergeAppStats, mergeHourlyData, shouldClearCache } from '@/utils/stats-merge';
import { StatItem, StatsResponse } from '@/utils/dashboard-utils';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useDashboardStore } from '@/store/dashboard-store';
import { toast } from 'sonner';

export function useDashboardStats() {
    const timeZone = useDashboardStore(state => state.timeZone);
    const queryClient = useQueryClient();
    const router = useRouter();
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

            const lastFetch = cachedData?._lastFetch || null;

            if (lastFetch && !shouldClearCache(lastFetch, timeZone)) {
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

            if (error) {
                if (error.status === 401) {
                    await authClient.signOut();
                    router.push('/login');
                }
                throw error;
            }
            if (!data || !data.success || !data.data) throw new Error('Invalid data response');

            // Hydrate normalized data to full objects
            const apiData = data.data;

            // Merge new apps with cached apps
            const apps = mergeApps(cachedApps, apiData.apps);

            const hydratedHourly: Record<number, StatItem[]> = {};
            Object.keys(apiData.hourly).forEach(k => {
                const hour = parseInt(k);
                const items = apiData.hourly[k] || [];
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
        refetchInterval: 60 * 1000,
        retry: 1,
        placeholderData: (previousData: StatsResponse['data'] | undefined) => previousData,
    });

    useEffect(() => {
        if (query.isError && query.error) {
            console.error('Failed to sync data:', query.error);
            // Only toast if it's not a 401 (which is handled by redirect)
            const err = query.error as any;
            if (!err?.status || err.status !== 401) {
                const status = err?.status ? ` [${err.status}]` : '';
                toast.error(`Failed to sync latest data${status}`, {
                    description: 'Check your connection if this persists.',
                    id: 'stats-sync-error'
                });
            }
        }
    }, [query.isError, query.error]);

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
