import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';

const globalQueryClient = globalThis as unknown as {
    postgres: SQL;
};

const client = globalQueryClient.postgres || new SQL(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== 'production') {
    globalQueryClient.postgres = client;
}

export const db = drizzle(client, { schema });
