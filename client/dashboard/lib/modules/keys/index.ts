import { Elysia } from 'elysia';
import { KeysService } from './service';
import { KeysModel } from './model';
import { getUser } from '../../utils/auth-utils';
import { AppError } from '../../utils/error';

export const keysController = new Elysia()
    .get('/keys', async ({ request }) => {
        const currentUser = await getUser(request);
        if (!currentUser) throw new AppError('Unauthorized', 401);

        const keys = await KeysService.getKeys(currentUser.id);
        return { success: true, data: keys };
    })
    .post('/keys', async ({ body, request }) => {
        const currentUser = await getUser(request);
        if (!currentUser) throw new AppError('Unauthorized', 401);

        const key = await KeysService.createKey(currentUser.id, body.label);
        return { success: true, key };
    }, {
        body: KeysModel.createBody
    })
    .delete('/keys/:id', async ({ params, request }) => {
        const currentUser = await getUser(request);
        if (!currentUser) throw new AppError('Unauthorized', 401);

        await KeysService.deleteKey(currentUser.id, params.id);
        return { success: true };
    }, {
        params: KeysModel.params
    });
