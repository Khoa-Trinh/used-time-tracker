'use client';

import CategoryDistribution from './charts/CategoryDistribution';
import ActivityProfile from './charts/ActivityProfile';

export default function DashboardCharts() {
    return (
        <div className="grid grid-cols-1 gap-6 mb-6">
            <CategoryDistribution />
            <ActivityProfile />
        </div>
    );
}
