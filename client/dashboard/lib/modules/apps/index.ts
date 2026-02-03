
import { Elysia } from 'elysia';
import { AppsService } from './service';
import { AppsModel } from './model';
import { getUser } from '../../utils/auth-utils';
import { AppError } from '../../utils/error';

export const appsController = new Elysia()
    .patch('/apps/:id/category', async ({ params, body, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            throw new AppError('Unauthorized', 401);
        }

        return await AppsService.updateAppCategory({
            appId: params.id,
            category: body.category,
            userId: currentUser.id,
            autoSuggested: body.autoSuggested
        });
    }, {
        params: AppsModel.updateCategoryParams,
        body: AppsModel.updateCategoryBody
    })
    .post('/apps/suggest', async ({ body, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            throw new AppError('Unauthorized', 401);
        }

        const result = await AppsService.suggestCategory(body.appName, currentUser.id);
        return { success: true, data: result };
    }, {
        body: AppsModel.suggestBody
    });
