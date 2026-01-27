'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatItem, formatTime, IGNORED_APPS } from '@/app/utils/dashboard-utils';
import { PieChart as PieIcon } from 'lucide-react';
import { useDashboardStore } from '@/app/store/dashboard-store';

const COLORS = {
    productive: '#10b981', // emerald-500
    distracting: '#ef4444', // red-500
    neutral: '#3b82f6',     // blue-500
    uncategorized: '#71717a' // zinc-500
};

export default function CategoryDistribution() {
    const dailyStats = useDashboardStore(state => state.dailyStats);
    const hideBrowsers = useDashboardStore(state => state.hideBrowsers);

    const data = useMemo(() => {
        let stats = dailyStats;
        if (hideBrowsers) {
            stats = stats.filter(item => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
        }

        const distribution = {
            productive: 0,
            distracting: 0,
            neutral: 0,
            uncategorized: 0
        };

        stats.forEach(app => {
            const cat = app.category || 'uncategorized';
            if (cat in distribution) {
                distribution[cat as keyof typeof distribution] += app.totalTimeMs;
            }
        });

        return Object.entries(distribution)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    }, [dailyStats]);

    // console.log('[Charts] Category Data:', data);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-foreground text-background px-3 py-1.5 rounded-md shadow-md text-xs">
                    <p className="font-medium capitalize mb-0.5">{data.name}</p>
                    <p className="text-muted-foreground">{formatTime(data.value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-card border-border shadow-sm flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-muted-foreground" />
                    Category Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.uncategorized}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="capitalize text-sm text-muted-foreground ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
