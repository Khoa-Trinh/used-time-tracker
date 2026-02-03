
import { Elysia} from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from '@/lib/modules/auth'
import { sessionController } from '@/lib/modules/session'
import { analyticsController } from '@/lib/modules/analytics'
import { appsController } from '@/lib/modules/apps'
import { keysController } from '@/lib/modules/keys'
import { AppError } from '@/lib/utils/error'

import { gzipSync, brotliCompressSync } from 'node:zlib';

const app = new Elysia({ prefix: '/api' })
    .use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
        credentials: true
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

    .use(sessionController)
    .use(analyticsController)
    .use(appsController)
    .use(keysController)

export const GET = app.fetch
export const POST = app.fetch
export const PUT = app.fetch
export const DELETE = app.fetch
export const PATCH = app.fetch
export const HEAD = app.fetch

export type App = typeof app
