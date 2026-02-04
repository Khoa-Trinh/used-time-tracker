import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/modules/auth'

export async function proxy(request: NextRequest) {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';
    const { pathname } = request.nextUrl;

    // 1. If in Local Mode, bypass session check completely for speed
    if (authMode === 'local') {
        if (pathname === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 2. Use Better Auth server API to resolve the session
    // This automatically handles cookie names, prefixes, and caching
    const session = await auth.api.getSession({
        headers: request.headers
    });

    const isLoggedIn = !!session;

    // 3. Hosted Mode logic
    if (!isLoggedIn && pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isLoggedIn && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|auth-bg.png).*)',
    ],
}
