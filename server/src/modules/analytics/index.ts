
import { Elysia } from 'elysia';
import { AnalyticsService } from './service';
import { AnalyticsModel } from './model';
import { getUser } from '../../utils/auth-utils';

export const analyticsController = new Elysia({ prefix: '/api' })
    .get('/stats', async ({ query, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            set.status = 401;
            return { success: false, error: 'Unauthorized' };
        }

        try {
            return await AnalyticsService.getStats({
                userId: currentUser.id,
                currentUser,
                ...query
            });
        } catch (e: any) {
            console.error('Stats Error:', e);
            set.status = 500;
            return { success: false, error: e.message || 'Internal Server Error' };
        }
    }, {
        query: AnalyticsModel.statsQuery
    });
