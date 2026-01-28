import { pgTable, text, timestamp, date, unique, bigint, uuid, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { categories } from './categories';

export const platformEnum = pgEnum('platform', ['web', 'ios', 'android', 'macos', 'windows', 'linux']);

export const devices = pgTable('devices', {
    id: uuid('id').defaultRandom().primaryKey(),
    externalDeviceId: text('external_device_id').notNull().unique(),
    platform: platformEnum('platform').notNull(),
    userId: text('user_id').references(() => user.id), // Link to User
});

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id)
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at')
});

export const dailyActivities = pgTable('daily_activities', {
    id: uuid('id').defaultRandom().primaryKey(),
    deviceId: uuid('device_id').references(() => devices.id).notNull(),
    date: date('date').notNull(),
}, (t) => ({
    unq: unique().on(t.deviceId, t.date),
}));

export const apps = pgTable('apps', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    categoryId: uuid('category_id'), // Will be FK to categories table
    autoSuggested: boolean('auto_suggested').notNull().default(false),
});

export const appUsages = pgTable('app_usages', {
    id: uuid('id').defaultRandom().primaryKey(),
    dailyActivityId: uuid('daily_activity_id').references(() => dailyActivities.id).notNull(),
    appId: uuid('app_id').references(() => apps.id).notNull(),
    totalTimeMs: bigint('total_time_ms', { mode: 'number' }).notNull().default(0),
}, (t) => ({
    unq: unique().on(t.dailyActivityId, t.appId),
}));

// ...existing code...
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

// Relations
import { relations } from 'drizzle-orm';

export const devicesRelations = relations(devices, ({ one, many }) => ({
    user: one(user, {
        fields: [devices.userId],
        references: [user.id],
    }),
    dailyActivities: many(dailyActivities),
}));

export const dailyActivitiesRelations = relations(dailyActivities, ({ one, many }) => ({
    device: one(devices, {
        fields: [dailyActivities.deviceId],
        references: [devices.id],
    }),
    appUsages: many(appUsages),
}));

export const appUsagesRelations = relations(appUsages, ({ one, many }) => ({
    dailyActivity: one(dailyActivities, {
        fields: [appUsages.dailyActivityId],
        references: [dailyActivities.id],
    }),
    app: one(apps, {
        fields: [appUsages.appId],
        references: [apps.id],
    }),
    timelines: many(usageTimelines),
}));

export const appsRelations = relations(apps, ({ many, one }) => ({
    usages: many(appUsages),
    category: one(categories, {
        fields: [apps.categoryId],
        references: [categories.id],
    }),
}));

export const usageTimelinesRelations = relations(usageTimelines, ({ one }) => ({
    appUsage: one(appUsages, {
        fields: [usageTimelines.appUsageId],
        references: [appUsages.id],
    }),
}));
