
import { Elysia } from 'elysia';
import { SessionService } from './service';
import { SessionModel } from './model';
import { getUser } from '../../utils/auth-utils';
import { AppError } from '../../utils/error';

export const sessionController = new Elysia()
    .post('/log-session', async ({ body, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            throw new AppError('Unauthorized', 401);
        }

        return await SessionService.logSession({
            userId: currentUser.id,
            ...body
        });
    }, {
        body: SessionModel.logSessionBody
    });
