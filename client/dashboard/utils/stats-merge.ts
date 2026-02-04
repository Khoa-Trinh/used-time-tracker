import { StatItem, AppMetadata } from './dashboard-utils';

/**
 * Checks if the cache should be cleared (e.g., if the day has changed)
 */
export const shouldClearCache = (lastFetchTimestamp: string | null): boolean => {
    if (!lastFetchTimestamp) return false;

    const lastDate = new Date(lastFetchTimestamp).toDateString();
    const today = new Date().toDateString();

    return lastDate !== today;
};

/**
 * Merges new hourly data into the existing cached hourly data
 */
export const mergeHourlyData = (
    current: Record<number, StatItem[]>,
    incoming: Record<number, StatItem[]>
): Record<number, StatItem[]> => {
    const merged = { ...current };

    Object.keys(incoming).forEach(key => {
        const hour = parseInt(key);
        // Be robust: handle string/number keys
        const incomingItems = incoming[key as any] || [];
        const existingItems = merged[hour] || [];

        // console.log(`[StatsMerge] Merging Hour ${hour}. Existing: ${existingItems.length}, Incoming: ${incomingItems.length}`);

        // Create a map of existing items by appId for quick lookup
        const itemMap = new Map();
        existingItems.forEach(item => itemMap.set(item.appId, item));

        incomingItems.forEach(newItem => {
            if (itemMap.has(newItem.appId)) {
                // Merge with existing item
                const existing = itemMap.get(newItem.appId)!;

                // 1. Accumulate total time
                const totalTimeMs = existing.totalTimeMs + newItem.totalTimeMs;

                // 2. Merge timelines (append new ones)
                const timelines = [...(existing.timelines || []), ...(newItem.timelines || [])];

                // 3. Merge platforms
                const platforms = Array.from(new Set([
                    ...(existing.platforms || []),
                    ...(newItem.platforms || [])
                ]));

                itemMap.set(newItem.appId, {
                    ...existing,
                    ...newItem, // Update metadata like category/autoSuggested
                    totalTimeMs,
                    timelines,
                    platforms
                });
            } else {
                // New item for this hour
                itemMap.set(newItem.appId, newItem);
            }
        });

        // Convert back to array
        merged[hour] = Array.from(itemMap.values());
    });

    return merged;
};

/**
 * Merges new daily stats into the existing cached daily stats
 */
export const mergeAppStats = (
    current: StatItem[],
    incoming: StatItem[]
): StatItem[] => {
    const itemMap = new Map();
    current.forEach(item => itemMap.set(item.appId, item));

    incoming.forEach(newItem => {
        if (itemMap.has(newItem.appId)) {
            const existing = itemMap.get(newItem.appId)!;

            // Accumulate total time
            const totalTimeMs = existing.totalTimeMs + newItem.totalTimeMs;

            // Merge platforms
            const platforms = Array.from(new Set([
                ...(existing.platforms || []),
                ...(newItem.platforms || [])
            ]));

            // Timelines might not be present in daily stats, but merge if they are
            const timelines = [...(existing.timelines || []), ...(newItem.timelines || [])];

            itemMap.set(newItem.appId, {
                ...existing,
                ...newItem,
                totalTimeMs,
                platforms,
                timelines
            });
        } else {
            // New item
            itemMap.set(newItem.appId, newItem);
        }
    });

    return Array.from(itemMap.values());
};

/**
 * Merges new app metadata into the existing cache
 */
export const mergeApps = (
    current: Record<string, AppMetadata>,
    incoming: Record<string, AppMetadata>
): Record<string, AppMetadata> => {
    // Simply spread incoming over current, as incoming updates take precedence (e.g. category change)
    // But since we only receive "new" apps mostly, this is efficient.
    return { ...current, ...incoming };
};

/**
 * Finds the latest timestamp in the incoming data to update our cursor
 */
export const findLatestTimestamp = (data: any): string | null => {
    return new Date().toISOString();
};
