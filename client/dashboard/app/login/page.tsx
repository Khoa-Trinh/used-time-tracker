import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginClient from './login-client';

export default async function LoginPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('better-auth.session_token');
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';

    // If we are in hosted mode AND have a token, redirect to home
    // In local mode, we usually allow access to dashboard, so redirecting to home is also fine/safe
    if (token) {
        redirect('/');
    }

    // If in Local Mode, usually we don't even need login, so we can also redirect home
    if (authMode === 'local') {
        redirect('/');
    }

    return <LoginClient />;
}
