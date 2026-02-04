
import { db } from '../../db';
import { devices, dailyActivities, appUsages, usageTimelines, apps } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface StatsQueryParams {
    from?: string;
    to?: string;
    groupBy?: string;
    since?: string;
    timeZone?: string;
    userId: string;
    currentUser: any;
    knownAppIds?: string[];
}

export abstract class AnalyticsService {
    static async getStats(params: StatsQueryParams) {
        const { from, to, timeZone, groupBy, since, currentUser, knownAppIds } = params;

        // Robust Timezone Handling
        let targetTimeZone = 'UTC';
        if (timeZone) {
            try {
                const decoded = decodeURIComponent(timeZone);
                Intl.DateTimeFormat(undefined, { timeZone: decoded });
                targetTimeZone = decoded;
            } catch (e) {
                console.warn(`[Stats] Invalid timeZone '${timeZone}', falling back to UTC`);
            }
        }

        // Default to today if not specified
        const now = new Date();
        const fromDate = from ? new Date(from) : now;
        const toDate = to ? new Date(to) : now;

        const fromStr = fromDate.toLocaleDateString('en-CA', { timeZone: targetTimeZone });
        const toStr = toDate.toLocaleDateString('en-CA', { timeZone: targetTimeZone });

        // Parse 'since' parameter for incremental loading
        const sinceDate = since ? new Date(since) : null;

        console.log(`[Stats] Querying for user ${currentUser.name} from ${fromStr} to ${toStr} (groupBy: ${groupBy}, since: ${sinceDate?.toISOString() || 'none'}, timeZone: ${targetTimeZone})`);

        // 1. Get user's devices
        const userDevices = await db.select({ id: devices.id, platform: devices.platform }).from(devices).where(eq(devices.userId, currentUser.id));
        const deviceIds = userDevices.map(d => d.id);
        const devicePlatformMap = new Map(userDevices.map(d => [d.id, d.platform]));

        // Return empty structure immediately if no devices
        if (deviceIds.length === 0) {
            return {
                success: true,
                data: {
                    apps: {},
                    hourly: {},
                    daily: []
                }
            };
        }

        // 2. Query Relationally
        const activities = await db.query.dailyActivities.findMany({
            where: (da, { and, inArray, gte, lte }) => and(
                inArray(da.deviceId, deviceIds),
                gte(da.date, fromStr),
                lte(da.date, toStr)
            ),
            with: {
                appUsages: {
                    with: {
                        app: true,
                        timelines: sinceDate ? {
                            // Incremental: only fetch timelines after 'since'
                            where: (tl, { gt }) => gt(tl.endTime, sinceDate)
                        } : true,
                    }
                }
            }
        });

        // Helper Types for normalization
        type AppMetadata = {
            appId: string;
            appName: string;
            category: 'productive' | 'distracting' | 'neutral' | 'uncategorized';
            autoSuggested: boolean;
            platforms: string[];
        };

        type HourlyItem = {
            appId: string;
            timelines: Array<{ startTime: string; endTime: string; deviceId: string }>;
        };

        type DailyItem = {
            appId: string;
            totalTimeMs: number;
        };


        if (groupBy === 'hour') {
            const hourlyBuckets: Record<number, Map<string, HourlyItem>> = {};
            const dailyMap = new Map<string, number>(); // appId -> totalTimeMs
            const appsMap = new Map<string, { meta: AppMetadata, platforms: Set<string> }>();

            // 2. Distribute Timelines into Hours
            for (const activity of activities) {
                const platform = devicePlatformMap.get(activity.deviceId);

                for (const usage of activity.appUsages) {
                    const app = usage.app as any;
                    const categoryValue = (app.category as AppMetadata['category']) || 'uncategorized';
                    const appId = app.id;

                    // Collect App Metadata
                    if (!appsMap.has(appId)) {
                        appsMap.set(appId, {
                            meta: {
                                appId,
                                appName: app.name,
                                category: categoryValue,
                                autoSuggested: app.autoSuggested || false,
                                platforms: []
                            },
                            platforms: new Set()
                        });
                    }
                    const appEntry = appsMap.get(appId)!;
                    if (platform) appEntry.platforms.add(platform);


                    // Daily Aggregation (Total Time)
                    for (const t of usage.timelines) {
                        let current = t.startTime.getTime();
                        let end = t.endTime.getTime();

                        // Process the segment (bucket into hours)
                        while (current < end) {
                            const date = new Date(current);
                            if (targetTimeZone) {
                                const hourStr = date.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: targetTimeZone });
                                const hour = parseInt(hourStr === '24' ? '0' : hourStr) % 24;

                                const parts = new Intl.DateTimeFormat('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    second: 'numeric',
                                    hour12: false,
                                    timeZone: targetTimeZone
                                }).formatToParts(date);

                                const min = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
                                const sec = parseInt(parts.find(p => p.type === 'second')?.value || '0');
                                const msInHour = (min * 60 + sec) * 1000 + date.getMilliseconds();
                                const msRemaining = 3600000 - msInHour;

                                const segmentDuration = Math.min(end - current, msRemaining);
                                const nextStep = current + segmentDuration;

                                // Lazy initialize bucket
                                if (!hourlyBuckets[hour]) hourlyBuckets[hour] = new Map();
                                const map = hourlyBuckets[hour];

                                if (!map.has(appId)) {
                                    map.set(appId, {
                                        appId,
                                        timelines: []
                                    });
                                }
                                const entry = map.get(appId)!;
                                entry.timelines.push({
                                    startTime: new Date(current).toISOString(),
                                    endTime: new Date(nextStep).toISOString(),
                                    deviceId: activity.deviceId
                                });

                                // Update Daily Total
                                dailyMap.set(appId, (dailyMap.get(appId) || 0) + segmentDuration);

                                current = nextStep;
                                if (segmentDuration <= 0) break;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }

            // 3. Final Format

            // Format Apps
            // Format Apps
            const appsResult: Record<string, AppMetadata> = {};
            const knownSet = new Set(knownAppIds || []);

            appsMap.forEach((val, key) => {
                if (!knownSet.has(key)) {
                    appsResult[key] = {
                        ...val.meta,
                        platforms: Array.from(val.platforms)
                    };
                }
            });

            // Format Hourly
            const finalHourlyResult: Record<number, HourlyItem[]> = {};
            Object.keys(hourlyBuckets).forEach(hourKey => {
                const hour = parseInt(hourKey);
                const map = hourlyBuckets[hour];
                if (!map) return;

                finalHourlyResult[hour] = Array.from(map.values());
            });

            // Format Daily
            const dailyResult: DailyItem[] = [];
            dailyMap.forEach((totalTimeMs, appId) => {
                dailyResult.push({ appId, totalTimeMs });
            });
            // Sort daily by totalTimeMs descending
            dailyResult.sort((a, b) => b.totalTimeMs - a.totalTimeMs);

            return {
                success: true,
                data: {
                    apps: appsResult,
                    hourly: finalHourlyResult,
                    daily: dailyResult
                }
            };
        } else {
            return {
                success: true,
                data: {
                    apps: {},
                    hourly: {},
                    daily: []
                }
            };
        }
    }
}
