/**
 * Utilities for merging incremental stats data
 */

import { StatItem } from '../utils/dashboard-utils';

/**
 * Merge app statistics by appId
 * Combines timelines and updates totalTimeMs
 */
export function mergeAppStats(cached: StatItem[], newData: StatItem[]): StatItem[] {
    const appMap = new Map(cached.map(app => [app.appId, { ...app }]));

    for (const newApp of newData) {
        const existing = appMap.get(newApp.appId);
        if (existing) {
            // Merge timelines and update totals
            existing.timelines = [...existing.timelines, ...newApp.timelines];
            existing.totalTimeMs += newApp.totalTimeMs;

            // Update category if it changed (server might have auto-categorized)
            if (newApp.category !== existing.category) {
                existing.category = newApp.category;
            }

            // Merge platforms
            if (newApp.platforms) {
                newApp.platforms.forEach(p => existing.platforms?.push(p));
            }
        } else {
            appMap.set(newApp.appId, newApp);
        }
    }

    return Array.from(appMap.values());
}

/**
 * Merge hourly data buckets
 */
export function mergeHourlyData(
    cached: Record<number, StatItem[]>,
    newData: Record<number, StatItem[]>
): Record<number, StatItem[]> {
    const merged: Record<number, StatItem[]> = { ...cached };

    for (const hourStr in newData) {
        const hour = parseInt(hourStr);
        const cachedApps = merged[hour] || [];
        const newApps = newData[hour];

        merged[hour] = mergeAppStats(cachedApps, newApps);
    }

    return merged;
}

/**
 * Find the latest timeline endTime across all data
 */
export function findLatestTimestamp(data: {
    hourly?: Record<number, StatItem[]>;
    daily?: StatItem[];
}): string | null {
    let latest: Date | null = null;

    // Check hourly data
    if (data.hourly) {
        for (const hour in data.hourly) {
            const apps = data.hourly[hour];
            for (const app of apps) {
                for (const timeline of app.timelines) {
                    const endTime = new Date(timeline.endTime);
                    if (!latest || endTime > latest) {
                        latest = endTime;
                    }
                }
            }
        }
    }

    // Check daily data (fallback)
    if (data.daily && (!latest)) {
        for (const app of data.daily) {
            for (const timeline of app.timelines) {
                const endTime = new Date(timeline.endTime);
                if (!latest || endTime > latest) {
                    latest = endTime;
                }
            }
        }
    }

    return latest ? latest.toISOString() : null;
}

/**
 * Check if we should clear cache (e.g., date changed)
 */
export function shouldClearCache(lastFetchTimestamp: string | null): boolean {
    if (!lastFetchTimestamp) return false;

    const lastFetchDate = new Date(lastFetchTimestamp);
    const today = new Date();

    // Clear if date changed (new day)
    return (
        lastFetchDate.getDate() !== today.getDate() ||
        lastFetchDate.getMonth() !== today.getMonth() ||
        lastFetchDate.getFullYear() !== today.getFullYear()
    );
}
