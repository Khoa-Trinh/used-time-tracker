
import { Elysia } from 'elysia';
import { SessionService } from './service';
import { SessionModel } from './model';
import { getUser } from '../../utils/auth-utils';

export const sessionController = new Elysia({ prefix: '/api' })
    .post('/log-session', async ({ body, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            set.status = 401;
            return { success: false, error: 'Unauthorized' };
        }

        try {
            return await SessionService.logSession({
                userId: currentUser.id,
                ...body
            });
        } catch (e: any) {
            console.error('Session Log Error:', e);
            if (e.message.includes('startTime must be before endTime')) return { success: false, error: e.message };
            if (e.message.includes('Duration cannot exceed')) return { success: false, error: e.message };

            set.status = 500;
            return { success: false, error: e.message || 'Internal Server Error' };
        }
    }, {
        body: SessionModel.logSessionBody
    });
