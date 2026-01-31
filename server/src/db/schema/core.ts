
import { pgTable, text, timestamp, date, unique, bigint, uuid, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { apps } from './apps';

export const platformEnum = pgEnum('platform', ['web', 'ios', 'android', 'macos', 'windows', 'linux']);

export const devices = pgTable('devices', {
    id: uuid('id').defaultRandom().primaryKey(),
    externalDeviceId: text('external_device_id').notNull().unique(),
    platform: platformEnum('platform').notNull(),
    userId: text('user_id').references(() => user.id),
});

export const dailyActivities = pgTable('daily_activities', {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: uuid('device_id').references(() => devices.id).notNull(),
    date: date('date').notNull(),
}, (t) => [
    unique().on(t.deviceId, t.date),
]);

export const appUsages = pgTable('app_usages', {
    id: uuid('id').defaultRandom().primaryKey(),
    dailyActivityId: uuid('daily_activity_id').references(() => dailyActivities.id).notNull(),
    appId: uuid('app_id').references(() => apps.id).notNull(),
    totalTimeMs: bigint('total_time_ms', { mode: 'number' }).notNull().default(0),
}, (t) => [
    unique().on(t.dailyActivityId, t.appId),
]);

export const usageTimelines = pgTable('usage_timelines', {
    id: uuid('id').defaultRandom().primaryKey(),
    appUsageId: uuid('app_usage_id').references(() => appUsages.id).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
});

export const apiKeys = pgTable('api_keys', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull().unique(),
    userId: text('user_id').notNull().references(() => user.id),
    label: text('label'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at'),
});
