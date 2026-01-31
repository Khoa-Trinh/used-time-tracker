
import { db } from '../../db';
import { apps } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AIService } from '../../services/ai';

interface UpdateCategoryParams {
    appId: string;
    category: 'productive' | 'distracting' | 'neutral' | 'uncategorized';
    userId: string;
}

export abstract class AppsService {
    static async updateAppCategory(params: UpdateCategoryParams & { autoSuggested?: boolean }) {
        const { appId, category, userId, autoSuggested } = params;

        // Ensure category is valid enum value
        const validCategories = ['productive', 'distracting', 'neutral', 'uncategorized'];
        if (!validCategories.includes(category)) {
            return { success: false, error: 'Invalid category' };
        }

        await db.update(apps)
            .set({
                category: category,
                autoSuggested: autoSuggested !== undefined ? autoSuggested : false // Default to false (manual) if not provided
            })
            .where(eq(apps.id, appId));

        return { success: true };
    }

    static async suggestCategory(appName: string, userId: string) {
        // Use the centralized AI service
        return await AIService.suggestCategory({
            appName,
            userId
        });
    }
}

