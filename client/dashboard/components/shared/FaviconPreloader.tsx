'use client';

import { useEffect } from 'react';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { preloadFavicons } from '@/lib/favicon-cache';
import { IGNORED_APPS } from '@/utils/dashboard-utils';
import { useDashboardStore } from '@/store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';

export function FaviconPreloader() {
    const { stats } = useDashboardStats();
    const { hideBrowsers } = useDashboardStore(useShallow(state => ({
        hideBrowsers: state.hideBrowsers
    })));

    useEffect(() => {
        const rawDailyStats = stats?.daily || [];
        if (rawDailyStats.length > 0) {
            let result = rawDailyStats;
            if (hideBrowsers) {
                result = result.filter(item => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
            }

            preloadFavicons(
                result.map(app => ({
                    appName: app.appName,
                    platform: app.platforms?.includes('web') ? 'web' : 'windows'
                }))
            );
        }
    }, [stats, hideBrowsers]);

    return null;
}
