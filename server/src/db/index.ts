import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';
import * as categoriesSchema from './categories';

const client = new SQL(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema: { ...schema, ...categoriesSchema } });
