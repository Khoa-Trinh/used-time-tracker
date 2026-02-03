
import { Elysia } from 'elysia';
import { AnalyticsService } from './service';
import { AnalyticsModel } from './model';
import { getUser } from '../../utils/auth-utils';
import { AppError } from '../../utils/error';

export const analyticsController = new Elysia()
    .post('/stats', async ({ query, body, request }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            throw new AppError('Unauthorized', 401);
        }

        return await AnalyticsService.getStats({
            userId: currentUser.id,
            currentUser,
            ...query,
            knownAppIds: body.knownAppIds || []
        });
    }, {
        query: AnalyticsModel.statsQuery,
        body: AnalyticsModel.statsBody
    });
