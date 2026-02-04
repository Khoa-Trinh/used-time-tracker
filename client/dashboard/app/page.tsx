import DashboardClient from './dashboard-client';
import { AuthCheck } from '@/components/auth/AuthCheck';
import { FaviconPreloader } from '@/components/shared/FaviconPreloader';


export default async function DashboardPage() {
  return (
    <>
      <AuthCheck />
      <FaviconPreloader />
      <DashboardClient />
    </>
  );
}
