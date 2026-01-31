import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('__Secure-used-time-tracker.session_token') || cookieStore.get('better-auth.session_token');
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';

    if (authMode !== 'local' && !token) {
        redirect('/login');
    }

    return <SettingsClient />;
}
