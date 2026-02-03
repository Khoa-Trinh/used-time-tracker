import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalQueryClient = globalThis as unknown as {
    postgres: Pool;
};

const client = globalQueryClient.postgres || new Pool({ connectionString: process.env.DATABASE_URL! });

if (process.env.NODE_ENV !== 'production') {
    globalQueryClient.postgres = client;
}

export const db = drizzle(client, { schema });
