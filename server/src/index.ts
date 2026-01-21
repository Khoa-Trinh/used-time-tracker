import { Elysia, t } from 'elysia';
import { db } from './db';
import { devices, dailyActivities, appUsages, usageTimelines, apps } from './db/schema';
import { sql, eq, and, gte, lte, sum, desc } from 'drizzle-orm';

import { cors } from '@elysiajs/cors';

const app = new Elysia()
    .use(cors())
    .get('/', () => 'Time Tracker API')
    .post('/api/log-session', async ({ body }) => {
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

        console.log(`[LOG] Session: ${appName} (${devicePlatform})`);
        console.log(`      Received: ${startTime}`);
        console.log(`      Parsed (UTC):   ${start.toISOString()}`);
        console.log(`      Parsed (Local): ${start.toLocaleString('en-US', { timeZone })}`);

        return await db.transaction(async (tx) => {
            // 1. Upsert Device
            let [device] = await tx.select().from(devices).where(eq(devices.externalDeviceId, deviceId));
            if (!device) {
                [device] = await tx.insert(devices).values({
                    externalDeviceId: deviceId,
                    platform: devicePlatform, // Type is validated by Elysia
                }).returning();
            }

            if (!device) {
                throw new Error('Failed to ensure device');
            }

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

            if (!daily) {
                throw new Error('Failed to ensure daily activity');
            }

            // 3. Upsert App (New Normalization)
            let [app] = await tx.select().from(apps).where(eq(apps.name, appName));

            if (!app) {
                [app] = await tx.insert(apps).values({ name: appName }).returning();
            }

            if (!app) {
                throw new Error('Failed to ensure app');
            }

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

            if (!usage) {
                throw new Error('Failed to ensure app usage');
            }

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
    })
    .get('/api/stats', async ({ query }) => {
        const { from, to, timeZone } = query;

        // Default to today if not specified
        const now = new Date();
        const fromDate = from ? new Date(from) : now;
        const toDate = to ? new Date(to) : now;

        // Format dates as YYYY-MM-DD for comparison with dailyActivities.date column
        const fromStr = fromDate.toLocaleDateString('en-CA', { timeZone: timeZone || 'UTC' });
        const toStr = toDate.toLocaleDateString('en-CA', { timeZone: timeZone || 'UTC' });

        console.log(`[Stats] Querying from ${fromStr} to ${toStr}`);

        const result = await db.select({
            appName: apps.name,
            totalTimeMs: sum(appUsages.totalTimeMs).mapWith(Number), // sum returns string in pg
        })
            .from(appUsages)
            .innerJoin(apps, eq(appUsages.appId, apps.id))
            .innerJoin(dailyActivities, eq(appUsages.dailyActivityId, dailyActivities.id))
            .where(
                and(
                    gte(dailyActivities.date, fromStr),
                    lte(dailyActivities.date, toStr)
                )
            )
            .groupBy(apps.name)
            .orderBy(desc(sum(appUsages.totalTimeMs)));

        return {
            success: true,
            data: result
        };
    }, {
        query: t.Object({
            from: t.Optional(t.String()),
            to: t.Optional(t.String()),
            timeZone: t.Optional(t.String())
        })
    })


// Only listen if run directly (not imported)
if (import.meta.main) {
    app.listen(3000);
    console.log(
        `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
    );
}

export default app;
