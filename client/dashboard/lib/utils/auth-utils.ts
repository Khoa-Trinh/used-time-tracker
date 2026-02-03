
import { db } from '../db';
import { user, apiKeys } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../modules/auth';

// Helper: Ensure default categories exist for a user
// export async function ensureDefaultCategories(userId: string) { ... } (Removed)

// Helper to get current user based on mode
export async function getUser(request: Request) {
    const mode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';

    if (mode === 'local') {
        // In local mode, always return the default Admin user
        let [admin] = await db.select().from(user).where(eq(user.email, 'admin@local'));

        if (!admin) {
            [admin] = await db.insert(user).values({
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
        // Hosted Mode: Validate Session OR API Key

        // 1. Check for API Key (Bearer sk_...)
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer sk_')) {
            const key = authHeader.replace('Bearer ', '');
            const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));

            if (apiKey) {
                // Update last used time (fire and forget)
                db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id)).execute();

                // Return linked user
                const [linkedUser] = await db.select().from(user).where(eq(user.id, apiKey.userId));
                return linkedUser || null;
            }
        }

        // 2. Check for Browser Session (Cookie)
        const session = await auth.api.getSession({ headers: request.headers });
        return session?.user || null;
    }
}
