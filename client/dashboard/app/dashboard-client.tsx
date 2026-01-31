'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';

import DashboardHeader from './components/DashboardHeader';
import SummaryCards from './components/SummaryCards';
import HourlyTimeline from './components/charts/HourlyTimeline';
import TimelineRow from './components/TimelineRow';
import { IGNORED_APPS, StatItem } from './utils/dashboard-utils';
import { useDashboardStore } from './store/dashboard-store';
import { useCategoryStore } from './store/category-store';
import { preloadFavicons } from '@/lib/favicon-cache';
import { Toaster } from '@/components/ui/sonner';

// Keep TopAppsList lazy as it's often off-screen
const TopAppsList = dynamic(() => import('./components/charts/TopAppsList'), {
  loading: () => <div className="h-[500px] w-full bg-card/50 rounded-3xl animate-pulse border border-border/50" />
});

const DashboardCharts = dynamic(() => import('./components/DashboardCharts'), {
  loading: () => (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <div className="h-[400px] bg-card/50 rounded-xl animate-pulse border border-border/50" />
      <div className="h-[400px] bg-card/50 rounded-xl animate-pulse border border-border/50" />
    </div>
  ),
  ssr: false
});

export default function DashboardClient() {
  const router = useRouter();

  const {
    dailyStats: rawDailyStats,
    loading,
    error,
    hideBrowsers,
    fetchStats,
  } = useDashboardStore(useShallow(state => ({
    dailyStats: state.dailyStats,
    loading: state.loading,
    error: state.error,
    hideBrowsers: state.hideBrowsers,
    fetchStats: state.fetchStats,
  })));

  const categoryMap = useCategoryStore(state => state.categoryMap);

  useEffect(() => {
    fetchStats(() => {
      authClient.signOut();
      router.push('/login');
    });
  }, [fetchStats, router]);

  // Filter Daily Stats (Client-Side Preference)
  const dailyStats = useMemo(() => {
    if (!rawDailyStats) return [];

    let result = rawDailyStats;
    if (hideBrowsers) {
      result = result.filter(item => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
    }
    return result;
  }, [rawDailyStats, hideBrowsers]);

  // Calculate Totals & Productivity (Hydrated with live categories)
  const { totalTimeMs, productiveMs, productivityScore, topApp, hydratedStats } = useMemo(() => {
    // Create a new array with updated categories for calculations and charts
    const hydrated = dailyStats.map(app => {
      const liveCategory = categoryMap[app.appId];
      if (liveCategory && (liveCategory.category !== app.category || liveCategory.autoSuggested !== app.autoSuggested)) {
        return {
          ...app,
          category: liveCategory.category as any,
          autoSuggested: liveCategory.autoSuggested
        };
      }
      return app;
    });

    const total = hydrated.reduce((acc, curr) => acc + curr.totalTimeMs, 0);
    const productive = hydrated.filter(a => a.category === 'productive').reduce((acc, curr) => acc + curr.totalTimeMs, 0);
    const score = total > 0 ? Math.round((productive / total) * 100) : 0;
    const top = hydrated.length > 0 ? hydrated[0] : null; // Top app usually effectively based on time, so order implies top

    return {
      totalTimeMs: total,
      productiveMs: productive,
      productivityScore: score,
      topApp: top,
      hydratedStats: hydrated
    };
  }, [dailyStats, categoryMap]);

  // Preload favicons for all apps with Browser Cache API
  useEffect(() => {
    if (dailyStats.length > 0) {
      preloadFavicons(
        dailyStats.map(app => ({
          appName: app.appName,
          platform: app.platforms?.includes('web') ? 'web' : 'windows'
        }))
      );
    }
  }, [dailyStats]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-destructive gap-2">
      <AlertCircle /> {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans selection:bg-primary/30">
      <Toaster />
      <div
        className="max-w-[95%] mx-auto space-y-8"
      >
        <DashboardHeader />

        <SummaryCards
          loading={loading}
          totalTimeMs={totalTimeMs}
          topApp={topApp}
          productivityScore={productivityScore}
          productiveMs={productiveMs}
        />

        <HourlyTimeline />

        {/* Pass filtered (stale category) stats to avoid re-renders. Rows handle updates via hook. */}
        <TopAppsList loading={loading} dailyStats={dailyStats} />

        {/* Pass hydrated stats to charts for correct categorization */}
        <DashboardCharts dailyStats={hydratedStats} />

      </div>
    </div>
  );
}
