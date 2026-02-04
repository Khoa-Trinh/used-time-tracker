import DashboardClient from './dashboard-client';
import { AuthCheck } from '@/components/AuthCheck';
import { FaviconPreloader } from '@/components/FaviconPreloader';


export default async function DashboardPage() {
  return (
    <>
      <AuthCheck />
      <FaviconPreloader />
      <DashboardClient />
    </>
  );
}
