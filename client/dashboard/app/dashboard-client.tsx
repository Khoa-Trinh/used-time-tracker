'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';

import DashboardHeader from './components/DashboardHeader';
import SummaryCards from './components/SummaryCards';
import HourlyTimeline from './components/charts/HourlyTimeline';
import TimelineRow from './components/TimelineRow';
import { IGNORED_APPS, StatItem } from './utils/dashboard-utils';
import { useDashboardStore } from './store/dashboard-store';

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

interface DashboardClientProps {
  initialData?: {
    hourly: Record<number, StatItem[]>;
    daily: StatItem[];
  } | null;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();

  // Hydrate store from server data immediately (before render if possible)
  const initialized = useRef(false);
  if (!initialized.current && initialData) {
    useDashboardStore.setState({
      hourlyData: initialData.hourly,
      dailyStats: initialData.daily,
      loading: false,
      error: null
    });
    initialized.current = true;
  }

  // Optimize selectors: Only subscribe to data we actually use here.
  // Crucially, we DO NOT subscribe to 'selectedHour' or 'hourlyData' here,
  // so hour changes don't re-render the whole dashboard layout.
  const {
    dailyStats: rawDailyStats,
    loading,
    error,
    hideBrowsers,
    fetchStats
  } = useDashboardStore(useShallow(state => ({
    dailyStats: state.dailyStats,
    loading: state.loading,
    error: state.error,
    hideBrowsers: state.hideBrowsers,
    fetchStats: state.fetchStats
  })));

  useEffect(() => {
    fetchStats(() => {
      authClient.signOut();
      router.push('/login');
    });
  }, [fetchStats, router]);

  // Filter Daily Stats (Client-Side Preference)
  const dailyStats = useMemo(() => {
    let result = rawDailyStats;
    if (hideBrowsers) {
      result = result.filter(item => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
    }
    return result;
  }, [rawDailyStats, hideBrowsers]);

  // Calculate Totals & Productivity
  const { totalTimeMs, productiveMs, productivityScore, topApp } = useMemo(() => {
    const total = dailyStats.reduce((acc, curr) => acc + curr.totalTimeMs, 0);
    const productive = dailyStats.filter(a => a.category === 'productive').reduce((acc, curr) => acc + curr.totalTimeMs, 0);
    const score = total > 0 ? Math.round((productive / total) * 100) : 0;
    const top = dailyStats.length > 0 ? dailyStats[0] : null;
    return { totalTimeMs: total, productiveMs: productive, productivityScore: score, topApp: top };
  }, [dailyStats]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-destructive gap-2">
      <AlertCircle /> {error}
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans selection:bg-primary/30">
      <motion.div
        className="max-w-[95%] mx-auto space-y-8"
        variants={container}
        animate="show"
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

        <TopAppsList loading={loading} dailyStats={dailyStats} />

        <DashboardCharts />

      </motion.div>
    </div>
  );
}
