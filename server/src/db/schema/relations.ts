
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { devices, dailyActivities, appUsages, usageTimelines, apiKeys } from './core';
import { apps, urlPatterns } from './apps';

// Auth Relations
export const userRelations = relations(user, ({ many }) => ({
    devices: many(devices),
    apiKeys: many(apiKeys),
}));

// Core Relations (Devices, Activities, Usages)
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

export const usageTimelinesRelations = relations(usageTimelines, ({ one }) => ({
    appUsage: one(appUsages, {
        fields: [usageTimelines.appUsageId],
        references: [appUsages.id],
    }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
    user: one(user, {
        fields: [apiKeys.userId],
        references: [user.id],
    }),
}));

// Apps Relations
export const appsRelations = relations(apps, ({ many }) => ({
    usages: many(appUsages),
}));

export const urlPatternsRelations = relations(urlPatterns, ({ one }) => ({
    user: one(user, {
        fields: [urlPatterns.userId],
        references: [user.id],
    }),
}));
