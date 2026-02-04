'use client';

import DashboardHeader from '@/components/header/DashboardHeader';
import HourlyTimeline from '@/components/timeline/HourlyTimeline';
import SummaryCards from '@/components/dashboard/SummaryCards';
import TopAppsList from '@/components/dashboard/TopAppsList';
import CategoryDistribution from '@/components/dashboard/CategoryDistribution';
import ActivityProfile from '@/components/dashboard/ActivityProfile';

export default function DashboardClient() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans selection:bg-primary/30">
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

