
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
    currentUser: any; // Ideally typed from User model
}

export abstract class AnalyticsService {
    static async getStats(params: StatsQueryParams) {
        const { from, to, timeZone, groupBy, since, currentUser } = params;

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

        if (deviceIds.length === 0) {
            return {
                success: true,
                data: {
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

        // Helper Types
        type TimelineSegment = {
            start: number;
            end: number;
            deviceId: string;
        };

        type ProcessedApp = {
            appId: string;
            appName: string;
            totalTimeMs: number;
            timelines: TimelineSegment[];
            platforms: Set<string>;
            category: string;
            autoSuggested: boolean;
        };


        if (groupBy === 'hour') {
            const hourlyBuckets: Record<number, Map<string, ProcessedApp>> = {};
            for (let i = 0; i < 24; i++) hourlyBuckets[i] = new Map();

            // 2. Distribute Timelines into Hours
            for (const activity of activities) {
                const platform = devicePlatformMap.get(activity.deviceId);

                for (const usage of activity.appUsages) {
                    const app = usage.app as any;
                    const appName = app.name;


                    // Robust Category Resolution
                    const categoryValue = app.category || 'uncategorized';


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

                                const map = hourlyBuckets[hour];
                                if (map) {
                                    if (!map.has(appName)) {
                                        map.set(appName, {
                                            appId: app.id,
                                            appName,
                                            totalTimeMs: 0,
                                            timelines: [],
                                            platforms: new Set(),
                                            category: categoryValue,
                                            autoSuggested: app.autoSuggested || false
                                        });
                                    }
                                    const entry = map.get(appName)!;
                                    entry.totalTimeMs += segmentDuration;
                                    entry.timelines.push({
                                        start: current,
                                        end: nextStep,
                                        deviceId: activity.deviceId
                                    });
                                    if (platform) entry.platforms.add(platform);
                                }

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
            const finalHourlyResult: Record<number, any[]> = {};
            const dailyMap = new Map<string, any>();

            const categoryDistribution = {
                productive: 0,
                distracting: 0,
                neutral: 0,
                uncategorized: 0
            };

            const activityProfile = Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                label: `${i.toString().padStart(2, '0')}:00`,
                productive: 0,
                distracting: 0,
                neutral: 0,
                uncategorized: 0
            }));

            for (let i = 0; i < 24; i++) {
                const map = hourlyBuckets[i];
                if (map) {
                    const sortedApps = Array.from(map.values())
                        .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
                        .map(a => {
                            const platforms = Array.from(a.platforms);
                            const processed = {
                                ...a,
                                platforms,
                                timelines: a.timelines.map(t => ({
                                    deviceId: t.deviceId,
                                    startTime: new Date(t.start).toISOString(),
                                    endTime: new Date(t.end).toISOString()
                                }))
                            };

                            // Aggregate into Daily
                            if (!dailyMap.has(a.appName)) {
                                dailyMap.set(a.appName, {
                                    appId: a.appId,
                                    appName: a.appName,
                                    totalTimeMs: 0,
                                    category: a.category || 'uncategorized',
                                    autoSuggested: a.autoSuggested,
                                    platforms: new Set<string>()
                                });
                            }
                            const dailyEntry = dailyMap.get(a.appName);
                            dailyEntry.totalTimeMs += a.totalTimeMs;
                            platforms.forEach(p => dailyEntry.platforms.add(p));

                            // Activity Profile & Category Distribution calculation
                            const cat = (a.category as keyof typeof categoryDistribution) || 'uncategorized';
                            if (cat in categoryDistribution) {
                                categoryDistribution[cat] += a.totalTimeMs;
                            }

                            const hourEntry = activityProfile[i];
                            if (hourEntry && cat in hourEntry) {
                                (hourEntry as any)[cat] += (a.totalTimeMs / 1000 / 60);
                            }

                            return processed;
                        });
                    finalHourlyResult[i] = sortedApps;
                } else {
                    finalHourlyResult[i] = [];
                }
            }

            const dailyResult = Array.from(dailyMap.values())
                .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
                .map(a => ({
                    ...a,
                    platforms: Array.from(a.platforms)
                }));

            // Calculate Summary
            const totalTimeMs = dailyResult.reduce((acc, curr) => acc + curr.totalTimeMs, 0);
            const productiveMs = dailyResult
                .filter(a => a.category === 'productive')
                .reduce((acc, curr) => acc + curr.totalTimeMs, 0);
            const productivityScore = totalTimeMs > 0 ? Math.round((productiveMs / totalTimeMs) * 100) : 0;

            return {
                success: true,
                data: {
                    hourly: finalHourlyResult,
                    daily: dailyResult,
                    topApps: dailyResult.slice(0, 10),
                    categoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value })),
                    activityProfile,
                    summary: {
                        totalTimeMs,
                        productiveMs,
                        productivityScore
                    }
                }
            };
        } else {
            return {
                success: true,
                data: {
                    hourly: {},
                    daily: [],
                    topApps: [],
                    categoryDistribution: [],
                    activityProfile: [],
                    summary: { totalTimeMs: 0, productiveMs: 0, productivityScore: 0 }
                }
            };
        }
    }
}
