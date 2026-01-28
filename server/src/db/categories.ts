import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';
import { user } from './schema';
import { relations } from 'drizzle-orm';

// Categories table - user-owned categories
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => user.id).notNull(),
    name: text('name').notNull(),
    color: text('color').notNull(), // Hex color code
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// URL patterns table - for URL-level categorization
export const urlPatterns = pgTable('url_patterns', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => user.id).notNull(),
    pattern: text('pattern').notNull(), // URL pattern (supports wildcards)
    categoryId: uuid('category_id').references(() => categories.id).notNull(),
    priority: integer('priority').notNull().default(0), // Higher = more specific
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(user, {
        fields: [categories.userId],
        references: [user.id],
    }),
    urlPatterns: many(urlPatterns),
}));

export const urlPatternsRelations = relations(urlPatterns, ({ one }) => ({
    user: one(user, {
        fields: [urlPatterns.userId],
        references: [user.id],
    }),
    category: one(categories, {
        fields: [urlPatterns.categoryId],
        references: [categories.id],
    }),
}));
