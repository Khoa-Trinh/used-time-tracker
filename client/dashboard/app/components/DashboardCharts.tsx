'use client';

import CategoryDistribution from './charts/CategoryDistribution';
import ActivityProfile from './charts/ActivityProfile';

import { StatItem } from '@/app/utils/dashboard-utils';

interface DashboardChartsProps {
    dailyStats: StatItem[];
}

export default function DashboardCharts({ dailyStats }: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 gap-6 mb-6">
            <CategoryDistribution dailyStats={dailyStats} />
            <ActivityProfile />
        </div>
    );
}
