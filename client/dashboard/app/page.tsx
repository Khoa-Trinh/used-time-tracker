import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './dashboard-client';
import { AuthCheck } from '@/components/AuthCheck';
import { FaviconPreloader } from '@/components/FaviconPreloader';


export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__Secure-used-time-tracker.session_token') || cookieStore.get('better-auth.session_token');
  const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'local';

  // If Hosted Mode AND No Token -> Login
  if (authMode !== 'local' && !token) {
    redirect('/login');
  }

  return (
    <>
      <AuthCheck />
      <FaviconPreloader />
      <DashboardClient />
    </>
  );
}
