
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from '@/lib/modules/auth'
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { AnalyticsService } from '@/lib/modules/analytics/service'
import { AnalyticsModel } from '@/lib/modules/analytics/model'
import { AppsModel } from '@/lib/modules/apps/model'
import { AppsService } from '@/lib/modules/apps/service'
import { KeysService } from '@/lib/modules/keys/service'
import { KeysModel } from '@/lib/modules/keys/model'
import { SessionModel } from '@/lib/modules/session/model'
import { SessionService } from '@/lib/modules/session/service'
import { AppError } from '@/lib/utils/error';
import { getUser } from '@/lib/utils/auth-check';


const app = new Elysia({ prefix: '/api' })
    .use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    }))
    .mapResponse(({ request, set, responseValue }) => {
        if (!responseValue || typeof responseValue !== 'object' && typeof responseValue !== 'string') return;
        if (responseValue instanceof Response) return;

        const acceptEncoding = request.headers.get('accept-encoding') || '';
        // Helper to check compressibility (simple threshold)
        const isCompressible = (data: unknown) => {
            if (typeof data === 'string' && data.length > 1024) return true; // >1KB for strings
            if (typeof data === 'object' && data !== null) return true; // Always try to compress JSON
            return false;
        };

        if (!isCompressible(responseValue)) return;

        const encoder = new TextEncoder();
        const text = typeof responseValue === 'object' ? JSON.stringify(responseValue) : responseValue.toString();

        if (acceptEncoding.includes('br')) {
            set.headers['Content-Encoding'] = 'br';
            set.headers['Content-Type'] = typeof responseValue === 'object' ? 'application/json' : 'text/plain; charset=utf-8';
            return new Response(brotliCompressSync(encoder.encode(text)), {
                headers: set.headers as HeadersInit,
                status: typeof set.status === 'number' ? set.status : undefined
            });
        }

        if (acceptEncoding.includes('gzip')) {
            set.headers['Content-Encoding'] = 'gzip';
            set.headers['Content-Type'] = typeof responseValue === 'object' ? 'application/json' : 'text/plain; charset=utf-8';
            return new Response(gzipSync(encoder.encode(text)), {
                headers: set.headers as HeadersInit,
                status: typeof set.status === 'number' ? set.status : undefined
            });
        }
    })
    .onError(({ code, error, set }) => {
        console.error(`[API] Error (${code}):`, error);

        // Default to 500
        set.status = 500;

        // 1. Validation Errors (Elysia)
        if (code === 'VALIDATION') {
            set.status = 400;
            return {
                success: false,
                error: 'Validation failed',
                details: error.all
            };
        }

        // 2. Not Found (Elysia)
        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { success: false, error: 'Not Found' };
        }

        // 3. Custom App Errors (Structured)
        if (error instanceof AppError) {
            set.status = error.status;
            return {
                success: false,
                error: error.message,
                code: error.code !== 'UNKNOWN' ? error.code : undefined
            };
        }

        // 4. Unknown/Generic Errors
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return {
            success: false,
            error: errorMessage
        };
    })

    .get('/', () => 'Time Tracker API')

    .all('/auth/*', ({ request }) => auth.handler(request))

    // Session (Public/Key-only - Bypass global guard)
    .post('/log-session', async ({ body, request }) => {
        const authHeader = request.headers.get('Authorization') || '';
        const key = authHeader.replace('Bearer ', '');

        if (!key) throw new AppError('API Key required', 401);

        const userId = await KeysService.verifyKey(key);

        return await SessionService.logSession({
            userId,
            ...body
        });
    }, {
        body: SessionModel.logSessionBody,
        response: {
            200: SessionModel.logSessionResponse,
            400: SessionModel.errorResponse,
            401: SessionModel.errorResponse,
            500: SessionModel.errorResponse
        }
    })

    .resolve(async ({ request }) => {
        const user = await getUser(request)
        if (!user) throw new AppError('Unauthorized', 401)
        return { user }
    })

    // Analytics
    .post('/stats', async ({ query, body, user }) => {
        return await AnalyticsService.getStats({
            userId: user.id,
            currentUser: user,
            ...query,
            knownAppIds: body.knownAppIds || []
        });
    }, {
        query: AnalyticsModel.statsQuery,
        body: AnalyticsModel.statsBody,
        response: {
            200: AnalyticsModel.statsResponse,
            400: AnalyticsModel.errorResponse,
            401: AnalyticsModel.errorResponse
        }
    })

    // Apps
    .patch('/apps/:id/category', async ({ params, body, user }) => {
        return await AppsService.updateAppCategory({
            appId: params.id,
            category: body.category,
            userId: user.id,
            autoSuggested: body.autoSuggested
        });
    }, {
        params: AppsModel.updateCategoryParams,
        body: AppsModel.updateCategoryBody,
        response: {
            200: AppsModel.updateCategoryResponse,
            400: AppsModel.errorResponse,
            401: AppsModel.errorResponse
        }
    })

    .post('/apps/suggest', async ({ body, user }) => {
        const result = await AppsService.suggestCategory(body.appName, user.id);
        return { success: true, data: result };
    }, {
        body: AppsModel.suggestBody,
        response: {
            200: AppsModel.suggestResponse,
            400: AppsModel.errorResponse,
            401: AppsModel.errorResponse
        }
    })

    // Keys
    .get('/keys', async ({ user }) => {
        const keys = await KeysService.getKeys(user.id);
        return { success: true, data: keys };
    }, {
        response: {
            200: KeysModel.getKeysResponse,
            401: KeysModel.errorResponse
        }
    })

    .post('/keys', async ({ body, user }) => {
        const key = await KeysService.createKey(user.id, body.label);
        return { success: true, key };
    }, {
        body: KeysModel.createBody,
        response: {
            200: KeysModel.createKeyResponse,
            400: KeysModel.errorResponse,
            401: KeysModel.errorResponse
        }
    })

    .delete('/keys/:id', async ({ params, user }) => {
        await KeysService.deleteKey(user.id, params.id);
        return { success: true };
    }, {
        params: KeysModel.params,
        response: {
            200: KeysModel.deleteKeyResponse,
            400: KeysModel.errorResponse,
            401: KeysModel.errorResponse,
            404: KeysModel.errorResponse
        }
    })



export const GET = app.fetch
export const POST = app.fetch
export const PUT = app.fetch
export const DELETE = app.fetch
export const PATCH = app.fetch
export const HEAD = app.fetch
export const OPTIONS = app.fetch

export type App = typeof app
