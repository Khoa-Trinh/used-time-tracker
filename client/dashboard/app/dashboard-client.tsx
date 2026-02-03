'use client';

import DashboardHeader from '@/components/DashboardHeader';
import HourlyTimeline from '@/components/HourlyTimeline';
import SummaryCards from '@/components/SummaryCards';
import TopAppsList from '@/components/TopAppsList';
import { Toaster } from '@/components/ui/sonner';
import CategoryDistribution from '@/components/CategoryDistribution';
import ActivityProfile from '@/components/ActivityProfile';

export default function DashboardClient() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans selection:bg-primary/30">
      <Toaster />

      <div
        className="max-w-[95%] mx-auto space-y-8"
      >
        <DashboardHeader />

        <SummaryCards />

        <HourlyTimeline />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TopAppsList />
          <CategoryDistribution />
        </div>

        <ActivityProfile />

      </div>
    </div>
  );
}

