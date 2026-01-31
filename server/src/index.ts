
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { gzipSync, brotliCompressSync } from 'node:zlib';

import { auth } from './modules/auth';
import { sessionController } from './modules/session';
import { analyticsController } from './modules/analytics';
import { appsController } from './modules/apps';


// Global Middleware to handle Compression
const compressionMiddleware = (app: Elysia) => app.mapResponse((context) => {
    const { request, set } = context;
    const { response } = context as { response: unknown };
    if (!response || typeof response !== 'object' || response === null) return;
    if (response instanceof Response) return;

    // Simple threshold check (roughly >1KB)
    const isCompressible = (data: any) => {
        if (!data) return false;
        if (typeof data === 'object') return true;
        return typeof data === 'string' && data.length > 1024;
    };

    if (!isCompressible(response)) return;

    const acceptEncoding = request.headers.get('accept-encoding') || '';
    if (!acceptEncoding) return;

    // Determine correct status code
    let status: number | undefined;
    if (typeof set.status === 'number') status = set.status;
    if (typeof response === 'object' && 'status' in response && typeof (response as any).status === 'number') {
        status = (response as any).status;
    }

    // Try Brotli first
    if (acceptEncoding.includes('br')) {
        set.headers['Content-Encoding'] = 'br';
        set.headers['Content-Type'] = 'application/json';
        return new Response(brotliCompressSync(JSON.stringify(response)), {
            headers: set.headers as any,
            status
        });
    }

    // Fallback to Gzip
    if (acceptEncoding.includes('gzip')) {
        set.headers['Content-Encoding'] = 'gzip';
        set.headers['Content-Type'] = 'application/json';
        return new Response(gzipSync(JSON.stringify(response)), {
            headers: set.headers as any,
            status
        });
    }
});


const app = new Elysia()
    .use(cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
        credentials: true
    }))
    .use(compressionMiddleware)
    .get('/', () => 'Time Tracker API')

    // Auth Routes (Auth.js handles its own routing usually, or we wrap it)
    .all('/api/auth/*', ({ request }) => auth.handler(request))

    // Feature Modules through Controller
    .use(sessionController)
    .use(analyticsController)
    .use(appsController);

export default app;

if (import.meta.main) {
    app.listen(process.env.PORT || 3000);
    console.log(
        `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
    );
}
