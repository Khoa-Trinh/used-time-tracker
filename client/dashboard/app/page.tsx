import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './dashboard-client';

async function getStats(cookieHeader: string) {
  try {
    // We default to 'UTC' or try to guess? Client will re-fetch with correct timezone if needed, 
    // or we just show UTC initially. A small hydration mismatch update is fine compared to 6s wait.
    // Or we can rely on a cookie for timezone if we had one.
    const timeZone = 'UTC';
    const res = await fetch(`/api/stats?timeZone=${timeZone}&groupBy=hour`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (res.status === 401) return 'unauthorized';
    if (!res.ok) return null;

    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e) {
    console.error("Server fetch error", e);
    return null;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__Secure-used-time-tracker.session_token');
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';

  // If Hosted Mode AND No Token -> Login
  if (authMode !== 'local' && !token) {
    redirect('/login');
  }

  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const initialData = await getStats(cookieHeader);

  if (initialData === 'unauthorized' && authMode !== 'local') {
    redirect('/login');
  }

  // If initialData is string 'unauthorized' but local mode, or just null, passing null/undefined is fine.
  // We explicitly handle the type in Client
  const safeInitialData = (typeof initialData === 'object') ? initialData : null;

  return <DashboardClient initialData={safeInitialData} />;
}
