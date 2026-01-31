
import { pgTable, text, uuid, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth';


export const categoryEnum = pgEnum('category', ['productive', 'distracting', 'neutral', 'uncategorized']);

// --- Url Patterns ---
export const urlPatterns = pgTable('url_patterns', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => user.id).notNull(),
    pattern: text('pattern').notNull(), // URL pattern (supports wildcards)
    category: categoryEnum('category').notNull().default('uncategorized'),
    priority: integer('priority').notNull().default(0), // Higher = more specific
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apps = pgTable('apps', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    category: categoryEnum('category').notNull().default('uncategorized'),
    autoSuggested: boolean('auto_suggested').notNull().default(false),
});

