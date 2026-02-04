
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiKeys, user as userTable } from '@/lib/db/schema';
import { auth } from '@/lib/modules/auth';

export const getUser = async (request: Request) => {
    const mode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';

    if (mode === 'local') {
        let [admin] = await db.select().from(userTable).where(eq(userTable.email, 'admin@local'));

        if (!admin) {
            [admin] = await db.insert(userTable).values({
                id: crypto.randomUUID(),
                name: 'Local Admin',
                email: 'admin@local',
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();
        }
        return admin;
    } else {
        const authHeader = request.headers.get('Authorization');

        if (authHeader) {
            if (authHeader.startsWith('Bearer ')) {
                const key = authHeader.replace('Bearer ', '');

                if (!key.startsWith('sk_')) return null;

                const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));

                if (apiKey) {
                    // Update last used
                    db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id)).execute();
                    const [linkedUser] = await db.select().from(userTable).where(eq(userTable.id, apiKey.userId));
                    return linkedUser || null;
                }
            }

            return null;
        }

        const session = await auth.api.getSession({ headers: request.headers });
        return session?.user || null;
    }
}
