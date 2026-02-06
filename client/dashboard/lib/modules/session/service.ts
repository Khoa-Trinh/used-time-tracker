
import { AppError } from '@/lib/utils/error';
import { db } from '../../db';
import { devices, dailyActivities, appUsages, usageTimelines, apps, urlPatterns } from '../../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
// import { suggestCategory, matchUrlPattern } from '../../services/auto-categorize';
// import { AIService } from '../../services/ai';


// Constants
const BROWSER_KEYWORDS = ['vivaldi', 'chrome', 'msedge', 'edge', 'firefox', 'opera', 'brave', 'arc', 'safari'];
const isBrowserApp = (name: string) => BROWSER_KEYWORDS.some(k => name.toLowerCase().includes(k));

interface LogSessionParams {
    userId: string;
    deviceId: string;
    devicePlatform: 'web' | 'windows' | 'macos' | 'linux' | 'android' | 'ios';
    appName: string;
    startTime: string | Date; // Accept string input, convert internally
    endTime: string | Date;
    timeZone: string;
    url?: string;
}

export abstract class SessionService {
    static async logSession(params: LogSessionParams) {
        const { userId, deviceId, devicePlatform, appName, timeZone, url } = params;
        const start = new Date(params.startTime);
        const end = new Date(params.endTime);
        const durationMs = end.getTime() - start.getTime();

        // Validations
        if (start >= end) throw new AppError('startTime must be before endTime', 400);
        if (durationMs > 24 * 60 * 60 * 1000) throw new AppError('Duration cannot exceed 24 hours', 400);
        try {
            Intl.DateTimeFormat(undefined, { timeZone });
        } catch {
            throw new AppError('Invalid timeZone', 400);
        }

        console.log(`[LOG] Session: ${appName} (${devicePlatform}) ${durationMs}ms`);

        return await db.transaction(async (tx) => {
            // 1. Retroactive Pruning (Window vs Web)
            if (devicePlatform !== 'web' && !isBrowserApp(appName)) {
                await this.pruneRetroactively(tx, userId, start, end);
            }

            // 2. Ingestion Filtering (Web vs Window)
            let segmentsToInsert = [{ start, end }];
            let actualDurationToAdd = durationMs;

            if (devicePlatform === 'web') {
                const result = await this.filterIngestion(tx, userId, start, end);
                if (result.filtered) {
                    return { success: true, filtered: true, durationAdded: 0 };
                }
                segmentsToInsert = result.segments;
                actualDurationToAdd = result.totalDuration;
            }

            // 3. Upsert Core Data (Device, Daily, App, Usage)
            const usage = await this.upsertCoreData(tx, params, start);

            // 4. Insert Query Timeline(s)
            for (const seg of segmentsToInsert) {
                await tx.insert(usageTimelines).values({
                    appUsageId: usage.id,
                    startTime: seg.start,
                    endTime: seg.end
                });
            }

            // 5. Update Total Time
            if (actualDurationToAdd > 0) {
                await tx.update(appUsages)
                    .set({ totalTimeMs: sql`${appUsages.totalTimeMs} + ${actualDurationToAdd}` })
                    .where(eq(appUsages.id, usage.id));
            }

            return { success: true, filtered: false, durationAdded: actualDurationToAdd };
        });
    }

    private static async pruneRetroactively(tx: any, userId: string, start: Date, end: Date) {
        // Find overlapping web timelines
        const overlaps = await tx.select({
            timelineId: usageTimelines.id,
            appUsageId: appUsages.id,
            startTime: usageTimelines.startTime,
            endTime: usageTimelines.endTime,
            appName: apps.name
        })
            .from(usageTimelines)
            .innerJoin(appUsages, eq(usageTimelines.appUsageId, appUsages.id))
            .innerJoin(apps, eq(appUsages.appId, apps.id))
            .innerJoin(dailyActivities, eq(appUsages.dailyActivityId, dailyActivities.id))
            .innerJoin(devices, eq(dailyActivities.deviceId, devices.id))
            .where(and(
                eq(devices.platform, 'web'),
                eq(devices.userId, userId),
                sql`${usageTimelines.endTime} > ${start.toISOString()}::timestamptz`,
                sql`${usageTimelines.startTime} < ${end.toISOString()}::timestamptz`
            ));

        if (overlaps.length > 0) {
            console.log(`\n[PRUNE] ✂️  Pruning Web timelines due to overlapping Windows app session`);
            console.log(`      Incoming: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);

            for (const row of overlaps) {
                const webStart = new Date(row.startTime);
                const webEnd = new Date(row.endTime);

                // Calculate Overlap Interval
                const overlapStart = webStart > start ? webStart : start;
                const overlapEnd = webEnd < end ? webEnd : end;
                const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();

                if (overlapDuration <= 0) continue;

                console.log(`      ---`);
                console.log(`      Old Timeline: [${row.appName}] ${webStart.toLocaleTimeString()} - ${webEnd.toLocaleTimeString()}`);
                console.log(`      Filtered Out: ${overlapStart.toLocaleTimeString()} - ${overlapEnd.toLocaleTimeString()} (${overlapDuration}ms)`);

                const remnants = [];
                if (webStart < overlapStart) remnants.push(`${webStart.toLocaleTimeString()} - ${overlapStart.toLocaleTimeString()}`);
                if (webEnd > overlapEnd) remnants.push(`${overlapEnd.toLocaleTimeString()} - ${webEnd.toLocaleTimeString()}`);
                console.log(`      Sections Left: ${remnants.length > 0 ? remnants.join(', ') : 'None (Fully Deleted)'}`);

                // 1. Reduce Total Time
                await tx.update(appUsages)
                    .set({ totalTimeMs: sql`${appUsages.totalTimeMs} - ${overlapDuration}` })
                    .where(eq(appUsages.id, row.appUsageId));

                // 2. Delete original timeline
                await tx.delete(usageTimelines).where(eq(usageTimelines.id, row.timelineId));

                // 3. Insert Left Remnant
                if (webStart < overlapStart) {
                    await tx.insert(usageTimelines).values({
                        appUsageId: row.appUsageId,
                        startTime: webStart,
                        endTime: overlapStart
                    });
                }
                // 4. Insert Right Remnant
                if (webEnd > overlapEnd) {
                    await tx.insert(usageTimelines).values({
                        appUsageId: row.appUsageId,
                        startTime: overlapEnd,
                        endTime: webEnd
                    });
                }
            }
            console.log(`[PRUNE] Done.\n`);
        }
    }

    private static async filterIngestion(tx: any, userId: string, start: Date, end: Date) {
        console.log(`\n[FILTER] 🔍 Filtering incoming Web session against Windows apps`);
        console.log(`      Incoming Web: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);

        const blockers = await tx.select({
            appName: apps.name,
            startTime: usageTimelines.startTime,
            endTime: usageTimelines.endTime
        })
            .from(usageTimelines)
            .innerJoin(appUsages, eq(usageTimelines.appUsageId, appUsages.id))
            .innerJoin(apps, eq(appUsages.appId, apps.id))
            .innerJoin(dailyActivities, eq(appUsages.dailyActivityId, dailyActivities.id))
            .innerJoin(devices, eq(dailyActivities.deviceId, devices.id))
            .where(and(
                sql`${devices.platform} != 'web'`,
                eq(devices.userId, userId),
                sql`${usageTimelines.endTime} > ${start.toISOString()}::timestamptz`,
                sql`${usageTimelines.startTime} < ${end.toISOString()}::timestamptz`
            ));

        const validBlockers = blockers.filter((b: any) => !isBrowserApp(b.appName));
        let segmentsToInsert = [{ start, end }];

        if (validBlockers.length > 0) {
            for (const blocker of validBlockers) {
                console.log(`      Blocking App: [${blocker.appName}] ${new Date(blocker.startTime).toLocaleTimeString()} - ${new Date(blocker.endTime).toLocaleTimeString()}`);
                segmentsToInsert = this.subtractSegments(
                    segmentsToInsert,
                    new Date(blocker.startTime),
                    new Date(blocker.endTime)
                );
            }
        }

        if (segmentsToInsert.length === 0) {
            console.log(`      Filtered Out: Entire session`);
            console.log(`      Sections Left: None`);
            return { filtered: true, segments: [], totalDuration: 0 };
        }

        const totalDuration = segmentsToInsert.reduce((acc, seg) => acc + (seg.end.getTime() - seg.start.getTime()), 0);

        console.log(`      Sections Left: ${segmentsToInsert.map(s => `${s.start.toLocaleTimeString()} - ${s.end.toLocaleTimeString()}`).join(', ')}`);
        console.log(`      Final Duration: ${totalDuration}ms`);
        console.log(`[FILTER] Done.\n`);

        return { filtered: false, segments: segmentsToInsert, totalDuration };
    }


    private static async upsertCoreData(tx: any, params: LogSessionParams, start: Date) {
        const { userId, deviceId, devicePlatform, appName, url, timeZone } = params;

        // 1. Upsert Device & Link to User
        let [device] = await tx.select().from(devices).where(eq(devices.externalDeviceId, deviceId));

        if (!device) {
            [device] = await tx.insert(devices).values({
                externalDeviceId: deviceId,
                platform: devicePlatform,
                userId: userId
            }).returning();
            console.log(`[UPSERT] Created new device: ${deviceId} (${devicePlatform})`);
        } else if (!device.userId) {
            [device] = await tx.update(devices)
                .set({ userId: userId })
                .where(eq(devices.id, device.id))
                .returning();
            console.log(`[UPSERT] Linked existing device ${deviceId} to user ${userId}`);
        } else if (device.userId !== userId) {
            throw new AppError('Device belongs to another user', 403);
        }
        if (!device) throw new AppError('Failed to ensure device', 500);

        // 2. Upsert Daily Activity
        const dateStr = start.toLocaleDateString('en-CA', { timeZone });
        let [daily] = await tx.select().from(dailyActivities).where(
            and(eq(dailyActivities.deviceId, device.id), eq(dailyActivities.date, dateStr))
        );
        if (!daily) {
            [daily] = await tx.insert(dailyActivities).values({
                deviceId: device.id,
                date: dateStr
            }).returning();
            console.log(`[UPSERT] Created new daily activity for ${dateStr}`);
        }
        if (!daily) throw new AppError('Failed to ensure daily activity', 500);

        // 3. Upsert App (with Auto-cat)
        let [app] = await tx.select().from(apps).where(and(eq(apps.name, appName), sql`1=1`)).limit(1);

        if (!app) {
            let finalCategory = 'uncategorized';
            let autoSuggested = false;

            try {
                [app] = await tx.insert(apps).values({
                    name: appName,
                    category: finalCategory,
                    autoSuggested
                }).returning();
                console.log(`[UPSERT] Created new app entry: ${appName}`);
            } catch (e: any) {
                if (e.code === '23505' || (e.message && e.message.includes('unique constraint'))) {
                    [app] = await tx.select().from(apps).where(eq(apps.name, appName)).limit(1);
                } else {
                    throw e;
                }
            }
        }

        if (!app) throw new AppError('Failed to ensure app', 500);

        // 4. Upsert Usage
        let [usage] = await tx.select().from(appUsages).where(
            and(eq(appUsages.dailyActivityId, daily.id), eq(appUsages.appId, app.id))
        );
        if (!usage) {
            [usage] = await tx.insert(appUsages).values({
                dailyActivityId: daily.id,
                appId: app.id,
                totalTimeMs: 0
            }).returning();
            console.log(`[UPSERT] Created new usage record for ${appName} on ${dateStr}`);
        }
        if (!usage) throw new AppError('Failed to ensure usage', 500);

        return usage;
    }


    private static subtractSegments(segments: { start: Date; end: Date }[], blockStart: Date, blockEnd: Date) {
        const nextSegments: { start: Date; end: Date }[] = [];

        for (const seg of segments) {
            // Calculate Overlap
            const overlapStart = blockStart > seg.start ? blockStart : seg.start;
            const overlapEnd = blockEnd < seg.end ? blockEnd : seg.end;

            if (overlapStart < overlapEnd) {
                // Has overlap, split segment into remnants

                // Left Remnant
                if (seg.start < overlapStart) {
                    nextSegments.push({ start: seg.start, end: overlapStart });
                }
                // Right Remnant
                if (overlapEnd < seg.end) {
                    nextSegments.push({ start: overlapEnd, end: seg.end });
                }
            } else {
                // No overlap, keep segment as is
                nextSegments.push(seg);
            }
        }
        return nextSegments;
    }
}
