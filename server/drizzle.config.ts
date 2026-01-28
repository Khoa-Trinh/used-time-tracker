import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: ['./src/db/schema.ts', './src/db/categories.ts'],
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
