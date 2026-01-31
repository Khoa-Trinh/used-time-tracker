
import { Elysia } from 'elysia';
import { AppsService } from './service';
import { AppsModel } from './model';
import { getUser } from '../../utils/auth-utils';

export const appsController = new Elysia({ prefix: '/api' })
    .patch('/apps/:id/category', async ({ params, body, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            set.status = 401;
            return { success: false, error: 'Unauthorized' };
        }

        try {
            return await AppsService.updateAppCategory({
                appId: params.id,
                category: body.category,
                userId: currentUser.id,
                autoSuggested: body.autoSuggested
            });
        } catch (e: any) {
            console.error('Update App Error:', e);
            set.status = 500;
            return { success: false, error: e.message || 'Internal Server Error' };
        }
    }, {
        params: AppsModel.updateCategoryParams,
        body: AppsModel.updateCategoryBody
    })
    .post('/apps/suggest', async ({ body, request, set }) => {
        const currentUser = await getUser(request);
        if (!currentUser) {
            set.status = 401;
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const result = await AppsService.suggestCategory(body.appName, currentUser.id);
            return { success: true, data: result };
        } catch (e: any) {
            console.error('Suggest Category Error:', e);
            set.status = 500;
            return { success: false, error: e.message || 'Internal Server Error' };
        }
    }, {
        body: AppsModel.suggestBody
    });
