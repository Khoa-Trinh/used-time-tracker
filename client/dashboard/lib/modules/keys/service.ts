import { db } from '../../db';
import { apiKeys } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AppError } from '../../utils/error';

export abstract class KeysService {
    static async getKeys(userId: string) {
        return await db.select({
            id: apiKeys.id,
            label: apiKeys.label,
            createdAt: apiKeys.createdAt,
            lastUsedAt: apiKeys.lastUsedAt
        })
            .from(apiKeys)
            .where(eq(apiKeys.userId, userId))
            .orderBy(desc(apiKeys.createdAt));
    }

    static async createKey(userId: string, label: string) {
        // Generate a random key (simple implementation for now, or use crypto)
        const key = `ak_${crypto.randomUUID().replace(/-/g, '')}`;

        await db.insert(apiKeys).values({
            userId,
            label,
            key
        });

        return key;
    }

    static async deleteKey(userId: string, keyId: string) {
        const [existing] = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId));

        if (!existing) {
            throw new AppError('Key not found', 404);
        }

        if (existing.userId !== userId) {
            throw new AppError('Unauthorized', 401);
        }

        await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
        return { success: true };
    }
}
