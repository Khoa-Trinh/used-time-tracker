import { Elysia, t } from 'elysia';
import { db } from './db';
import { devices, dailyActivities, appUsages, usageTimelines, apps, apiKeys } from './db/schema';
import { sql, eq, and, gte, lte, sum, desc } from 'drizzle-orm';

import { cors } from '@elysiajs/cors';

import { auth } from './auth';
import { user } from './db/schema';

// Helper to get current user based on mode
async function getUser(request: Request) {
    const mode = process.env.AUTH_MODE || 'local';

    if (mode === 'local') {
        // In local mode, always return the default Admin user
        let [admin] = await db.select().from(user).where(eq(user.email, 'admin@local'));

        if (!admin) {
            [admin] = await db.insert(user).values({
                id: crypto.randomUUID(),
                name: 'Local Admin',
                email: 'admin@local',
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();
        }
        return admin;
    } else {
        // Hosted Mode: Validate Session OR API Key

        // 1. Check for API Key (Bearer sk_...)
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer sk_')) {
            const key = authHeader.replace('Bearer ', '');
            const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));

            if (apiKey) {
                // Update last used time (fire and forget)
                db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id)).execute();

                // Return linked user
                const [linkedUser] = await db.select().from(user).where(eq(user.id, apiKey.userId));
                return linkedUser || null;
            }
        }

        // 2. Check for Browser Session (Cookie)
        const session = await auth.api.getSession({ headers: request.headers });
        return session?.user || null;
    }
}

const app = new Elysia()
    .use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
        credentials: true
    }))
    .get('/', () => 'Time Tracker API')
    .all('/api/auth/*', ({ request }) => auth.handler(request))
    .post('/api/log-session', async ({ body, request }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            return { success: false, error: 'Unauthorized', status: 401 };
        }

        const { deviceId, devicePlatform, appName, startTime, endTime, timeZone } = body;
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end.getTime() - start.getTime();

        // Semantic Validation (logic that schema can't easily capture)
        if (start >= end) {
            return { success: false, error: 'startTime must be before endTime' };
        }

        if (durationMs > 24 * 60 * 60 * 1000) {
            return { success: false, error: 'Duration cannot exceed 24 hours' };
        }

        try {
            Intl.DateTimeFormat(undefined, { timeZone });
        } catch (e) {
            return { success: false, error: 'Invalid timeZone' };
        }

        console.log(`[LOG] Session: ${appName} (${devicePlatform}) ${durationMs}ms`);

        return await db.transaction(async (tx) => {
            // 1. Upsert Device & Link to User
            let [device] = await tx.select().from(devices).where(eq(devices.externalDeviceId, deviceId));

            if (!device) {
                // New device: Create and link to current user
                [device] = await tx.insert(devices).values({
                    externalDeviceId: deviceId,
                    platform: devicePlatform,
                    userId: currentUser.id
                }).returning();
            } else if (!device.userId) {
                // Existing device with no owner (legacy): Claim it
                [device] = await tx.update(devices)
                    .set({ userId: currentUser.id })
                    .where(eq(devices.id, device.id))
                    .returning();
            } else if (device.userId !== currentUser.id) {
                // Device owned by someone else
                // Log warning but maybe allow it? Or strict fail? 
                // For now, fail to prevent data pollution
                throw new Error('Device belongs to another user');
            }

            // ... rest of logic is same

            if (!device) throw new Error('Failed to ensure device');

            // 2. Upsert Daily Activity
            const dateStr = start.toLocaleDateString('en-CA', { timeZone });

            let [daily] = await tx.select().from(dailyActivities).where(
                and(eq(dailyActivities.deviceId, device.id), eq(dailyActivities.date, dateStr))
            );

            if (!daily) {
                [daily] = await tx.insert(dailyActivities).values({
                    deviceId: device.id,
                    date: dateStr,
                }).returning();
            }
            if (!daily) throw new Error('Failed to ensure daily activity');

            // 3. Upsert App
            let [app] = await tx.select().from(apps).where(eq(apps.name, appName));

            if (!app) {
                [app] = await tx.insert(apps).values({ name: appName }).returning();
            }
            if (!app) throw new Error('Failed to ensure app');

            // 4. Upsert App Usage
            let [usage] = await tx.select().from(appUsages).where(
                and(eq(appUsages.dailyActivityId, daily.id), eq(appUsages.appId, app.id))
            );

            if (!usage) {
                [usage] = await tx.insert(appUsages).values({
                    dailyActivityId: daily.id,
                    appId: app.id,
                    totalTimeMs: 0,
                }).returning();
            }
            if (!usage) throw new Error('Failed to ensure usage');

            // 5. Insert Timeline
            await tx.insert(usageTimelines).values({
                appUsageId: usage.id,
                startTime: start,
                endTime: end,
            });

            // 6. Update Total Time
            await tx.update(appUsages)
                .set({ totalTimeMs: sql`${appUsages.totalTimeMs} + ${durationMs}` })
                .where(eq(appUsages.id, usage.id));

            return { success: true, usageId: usage.id, durationAdded: durationMs };
        });

    }, {
        body: t.Object({
            deviceId: t.String(),
            devicePlatform: t.Union([
                t.Literal('web'),
                t.Literal('ios'),
                t.Literal('android'),
                t.Literal('macos'),
                t.Literal('windows'),
                t.Literal('linux')
            ]),
            appName: t.String(),
            startTime: t.String({ format: 'date-time' }), // ISO 8601 validation
            endTime: t.String({ format: 'date-time' }),
            timeZone: t.String(),
        })
    }) // Endpoint Chain Continues
    .get('/api/stats', async ({ query, request }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            return { success: false, error: 'Unauthorized', status: 401 };
        }

        const { from, to, timeZone, groupBy } = query;

        // Default to today if not specified
        const now = new Date();
        const fromDate = from ? new Date(from) : now;
        const toDate = to ? new Date(to) : now;

        const fromStr = fromDate.toLocaleDateString('en-CA', { timeZone: timeZone || 'UTC' });
        const toStr = toDate.toLocaleDateString('en-CA', { timeZone: timeZone || 'UTC' });

        console.log(`[Stats] Querying for user ${currentUser.name} from ${fromStr} to ${toStr} (groupBy: ${groupBy})`);

        // 1. Get user's devices
        const userDevices = await db.select({ id: devices.id, platform: devices.platform }).from(devices).where(eq(devices.userId, currentUser.id));
        const deviceIds = userDevices.map(d => d.id);
        const devicePlatformMap = new Map(userDevices.map(d => [d.id, d.platform]));

        if (deviceIds.length === 0) {
            return { success: true, data: groupBy === 'hour' ? {} : [] };
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
                        timelines: true,
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
        };

        const IGNORED_BROWSERS = new Set([
            'Google Chrome', 'Chrome', 'Microsoft Edge', 'Msedge', 'Firefox', 'Opera', 'Brave', 'Arc', 'Vivaldi'
        ]);

        if (groupBy === 'hour') {
            const hourlyBuckets: Record<number, Map<string, ProcessedApp>> = {};
            for (let i = 0; i < 24; i++) hourlyBuckets[i] = new Map();

            // 1. Pre-fetch Window Timelines (The "Truth" Source)
            const windowTimelines: TimelineSegment[] = [];
            const BROWSER_PROCESS_NAMES = new Set(['vivaldi', 'chrome', 'msedge', 'firefox', 'opera', 'brave', 'arc']);

            for (const activity of activities) {
                for (const usage of activity.appUsages) {
                    if (BROWSER_PROCESS_NAMES.has(usage.app.name.toLowerCase())) {
                        for (const t of usage.timelines) {
                            windowTimelines.push({
                                start: t.startTime.getTime(),
                                end: t.endTime.getTime(),
                                deviceId: activity.deviceId
                            });
                        }
                    }
                }
            }

            // Optimization: Sort window timelines for faster lookup (optional but good practice)
            windowTimelines.sort((a, b) => a.start - b.start);

            // 2. Distribute Timelines into Hours
            for (const activity of activities) {
                const platform = devicePlatformMap.get(activity.deviceId);
                const isWeb = platform === 'web';

                for (const usage of activity.appUsages) {
                    const appName = usage.app.name;

                    for (const t of usage.timelines) {
                        let start = t.startTime.getTime();
                        let end = t.endTime.getTime();

                        // INTERSECTION LOGIC:
                        // If this is a WEB timeline, we must intersect it with the WINDOW timelines.
                        // We modify 'validSegments' to hold the result.
                        let validSegments: { start: number, end: number }[] = [];

                        if (isWeb) {
                            // Find overlaps
                            for (const winT of windowTimelines) {
                                // Simple Intersection
                                const intersectStart = Math.max(start, winT.start);
                                const intersectEnd = Math.min(end, winT.end);

                                if (intersectStart < intersectEnd) {
                                    validSegments.push({ start: intersectStart, end: intersectEnd });
                                }
                            }
                        } else {
                            // Native app? Trust it 100%
                            validSegments.push({ start, end });
                        }

                        // Now process the valid segments (bucket them into hours)
                        for (const segment of validSegments) {
                            let current = segment.start;
                            const segmentEndAbsolute = segment.end;

                            while (current < segmentEndAbsolute) {
                                const date = new Date(current);
                                if (timeZone) {
                                    const hourStr = date.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone });
                                    const hour = parseInt(hourStr === '24' ? '0' : hourStr) % 24;

                                    const parts = new Intl.DateTimeFormat('en-US', {
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        second: 'numeric',
                                        hour12: false,
                                        timeZone
                                    }).formatToParts(date);

                                    const min = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
                                    const sec = parseInt(parts.find(p => p.type === 'second')?.value || '0');
                                    const msInHour = (min * 60 + sec) * 1000 + date.getMilliseconds();
                                    const msRemaining = 3600000 - msInHour;

                                    const segmentDuration = Math.min(segmentEndAbsolute - current, msRemaining);
                                    const nextStep = current + segmentDuration;

                                    const map = hourlyBuckets[hour];
                                    if (map) {
                                        if (!map.has(appName)) {
                                            map.set(appName, {
                                                appId: usage.app.id,
                                                appName,
                                                totalTimeMs: 0,
                                                timelines: [],
                                                platforms: new Set(),
                                                category: usage.app.category
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
            }

            // 2. Deduplication (Smart Merge) per Hour
            // DISABLED: Determining that the "Swiss Cheese" effect (cutting gaps in solid window data based on gappy browser data) 
            // is worse UX than double counting. User trusts Window data, so we must show it intact.
            /* 
            for (let i = 0; i < 24; i++) {
                const map = hourlyBuckets[i];
                if (!map) continue;

                const apps = Array.from(map.values());

                // Separate Browsers and Content
                const browsers = apps.filter(a => IGNORED_BROWSERS.has(a.appName));
                const content = apps.filter(a => !IGNORED_BROWSERS.has(a.appName));

                if (browsers.length > 0 && content.length > 0) {
                    // ... (Deduplication Logic Removed for now) ...
                }
            }
            */

            // 3. Final Format
            const finalResult: Record<number, any[]> = {};
            for (let i = 0; i < 24; i++) {
                const map = hourlyBuckets[i];
                if (map) {
                    finalResult[i] = Array.from(map.values())
                        .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
                        .map(a => ({
                            ...a,
                            platforms: Array.from(a.platforms), // Convert Set to Array
                            timelines: a.timelines.map(t => ({
                                deviceId: t.deviceId,
                                startTime: new Date(t.start).toISOString(),
                                endTime: new Date(t.end).toISOString()
                            }))
                        }));
                } else {
                    finalResult[i] = [];
                }
            }

            // 4. Aggregate Daily Stats (Server-Side)
            const dailyAggregation = new Map<string, any>();
            Object.values(finalResult).flat().forEach(item => {
                const appName = item.appName;
                if (!dailyAggregation.has(appName)) {
                    dailyAggregation.set(appName, {
                        ...item,
                        totalTimeMs: 0,
                        timelines: [], // We don't really need timelines for the daily summary view usually, but good to have structure
                        platforms: new Set(item.platforms) // Init set from array
                    });
                }
                const entry = dailyAggregation.get(appName)!;
                entry.totalTimeMs += item.totalTimeMs;
                item.platforms.forEach((p: string) => entry.platforms.add(p));
            });

            const dailyStats = Array.from(dailyAggregation.values())
                .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
                .map(item => ({
                    ...item,
                    platforms: Array.from(item.platforms)
                }));

            return {
                success: true,
                data: {
                    hourly: finalResult,
                    daily: dailyStats
                }
            };

        } else {
            type LegacyAppStats = {
                appId: string;
                appName: string;
                totalTimeMs: number;
                icon?: string;
                category: string;
                timelines: Array<{
                    deviceId: string;
                    startTime: string;
                    endTime: string;
                }>
            };

            const statsMap = new Map<string, LegacyAppStats>();

            for (const activity of activities) {
                for (const usage of activity.appUsages) {
                    const appName = usage.app.name;
                    if (!statsMap.has(appName)) {
                        statsMap.set(appName, {
                            appId: usage.app.id,
                            appName,
                            totalTimeMs: 0,
                            timelines: [],
                            category: usage.app.category
                        });
                    }
                    const entry = statsMap.get(appName)!;
                    entry.totalTimeMs += Number(usage.totalTimeMs);
                    for (const timeline of usage.timelines) {
                        entry.timelines.push({
                            deviceId: activity.deviceId,
                            startTime: timeline.startTime.toISOString(),
                            endTime: timeline.endTime.toISOString(),
                        });
                    }
                }
            }
            const result = Array.from(statsMap.values()).sort((a, b) => b.totalTimeMs - a.totalTimeMs);
            return { success: true, data: result };
        }
    })
    .group('/api/keys', (app) => app
        .get('/', async ({ request }) => {
            const user = await getUser(request);
            if (!user) return { success: false, error: 'Unauthorized', status: 401 };

            const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id));
            return {
                success: true,
                data: keys
            };
        })
        .post('/', async ({ body, request }) => {
            const user = await getUser(request);
            if (!user) return { success: false, error: 'Unauthorized', status: 401 };

            const key = `sk_${crypto.randomUUID().replace(/-/g, '')}`;

            await db.insert(apiKeys).values({
                key,
                userId: user.id,
                label: body.label || 'Unnamed Device',
            });

            return { success: true, key };
        }, {
            body: t.Object({ label: t.Optional(t.String()) })
        })
        .delete('/:id', async ({ params, request }) => {
            const user = await getUser(request);
            if (!user) return { success: false, error: 'Unauthorized', status: 401 };

            await db.delete(apiKeys).where(and(eq(apiKeys.id, params.id), eq(apiKeys.userId, user.id)));
            return { success: true };
        })
    )
    .group('/api/apps', (app) => app
        .patch('/:id/category', async ({ params, body, request }) => {
            const user = await getUser(request);
            if (!user) return { success: false, error: 'Unauthorized', status: 401 };

            const { category } = body;
            const appId = params.id;

            // In a real multi-user app, we might check if the user "owns" this app or has usage on it.
            // For now, since apps are global dictionary items, we allow any auth'd user to categorize.
            // Or better: apps are shared but maybe customization should be per user?
            // Schema has apps as global. Let's assume shared categorization for now (simple).

            await db.update(apps)
                .set({ category: category as any })
                .where(eq(apps.id, appId));

            return { success: true };
        }, {
            body: t.Object({
                category: t.Union([
                    t.Literal('productive'),
                    t.Literal('distracting'),
                    t.Literal('neutral'),
                    t.Literal('uncategorized')
                ])
            })
        })
    )


// Only listen if run directly (not imported)
if (import.meta.main) {
    app.listen(3000);
    console.log(
        `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
    );
}

export default app;
