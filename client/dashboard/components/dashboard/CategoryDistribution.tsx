'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatTime, IGNORED_APPS } from '@/utils/dashboard-utils';
import { PieChart as PieIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore } from '@/store/dashboard-store';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

const COLORS = {
    productive: '#10b981', // emerald-500
    distracting: '#f43f5e', // rose-500
    neutral: '#3b82f6', // blue-500
    uncategorized: '#71717a' // zinc-500
};

export default function CategoryDistribution() {
    const hideBrowsers = useDashboardStore(state => state.hideBrowsers);
    const { stats, isPending: loading } = useDashboardStats();
    const dailyStats = stats?.daily || [];
    const appsMap = stats?.apps || {};



    const { data, totalTime } = useMemo(() => {
        if (!dailyStats) return { data: [], totalTime: 0 };

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

        let total = 0;

        stats.forEach(app => {
            const liveCategory = appsMap[app.appId];
            const cat = ((liveCategory ? liveCategory.category : app.category) || 'uncategorized') as keyof typeof distribution;

            if (cat in distribution) {
                distribution[cat] += app.totalTimeMs;
                total += app.totalTimeMs;
            } else {
                distribution.uncategorized += app.totalTimeMs;
                total += app.totalTimeMs;
            }
        });

        const chartData = Object.entries(distribution)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value); // Sort largest to smallest

        return { data: chartData, totalTime: total };
    }, [dailyStats, hideBrowsers, appsMap]);

    if (loading) {
        return (
            <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col h-full min-h-[400px]">
                {/* Header Skeleton */}
                <div className="flex items-center gap-3 p-8 pb-2 border-b border-border/5">
                    <Skeleton className="w-10 h-10 rounded-xl bg-primary/10" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40 bg-primary/10" />
                        <Skeleton className="h-3 w-24 bg-primary/5" />
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 p-4 md:flex items-center">
                    {/* Chart Skeleton */}
                    <div className="w-full md:w-1/2 flex justify-center items-center py-4">
                        <Skeleton className="w-[200px] h-[200px] rounded-full bg-muted/10 border-4 border-muted/20" />
                    </div>
                    {/* Legend Skeleton */}
                    <div className="w-full md:w-1/2 px-4 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-3 h-3 rounded-full bg-muted/20" />
                                    <div className="space-y-1">
                                        <Skeleton className="w-24 h-4 bg-muted/20" />
                                        <Skeleton className="w-16 h-3 bg-muted/10" />
                                    </div>
                                </div>
                                <Skeleton className="w-12 h-4 bg-muted/20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataItem = payload[0].payload;
            const percentage = ((dataItem.value / totalTime) * 100).toFixed(1);
            return (
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 px-4 py-3 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[dataItem.name as keyof typeof COLORS] }}
                        />
                        <span className="font-semibold capitalize text-foreground">{dataItem.name}</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-lg font-bold font-mono text-foreground">{formatTime(dataItem.value)}</span>
                        <span className="text-sm text-muted-foreground mb-1">({percentage}%)</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col h-full min-h-[400px]">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 p-8 pb-2 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <PieIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Usage Distribution</h2>
                    <p className="text-xs text-muted-foreground font-medium">Time by category</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 md:flex items-center relative z-10 p-4">
                {/* Chart Section */}
                <div className="h-[250px] w-full md:w-1/2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={3}
                                cornerRadius={6}
                                dataKey="value"
                                stroke="none"
                                animationBegin={200}
                                animationDuration={1000}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.uncategorized}
                                        className="stroke-background/10 stroke-2"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Total Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
                            {formatTime(totalTime).split(' ').map((part, i) =>
                                isNaN(parseInt(part)) ? <span key={i} className="text-xs text-muted-foreground ml-0.5">{part}</span> : part
                            )}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mt-1">Total Time</span>
                    </div>
                </div>

                {/* Legend Section */}
                <div className="w-full md:w-1/2 px-4 md:pl-0 space-y-3 mt-4 md:mt-0">
                    {data.map((item) => {
                        const percentage = ((item.value / totalTime) * 100).toFixed(1);
                        const color = COLORS[item.name as keyof typeof COLORS] || COLORS.uncategorized;

                        return (
                            <div key={item.name} className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full ring-2 ring-transparent group-hover:ring-current/10 transition-all opacity-80"
                                        style={{ backgroundColor: color, color: color }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium capitalize text-foreground/90">{item.name}</span>
                                        <span className="text-xs text-muted-foreground">{percentage}% of total</span>
                                    </div>
                                </div>
                                <span className="font-mono text-sm font-semibold text-foreground/80 tabular-nums">
                                    {formatTime(item.value)}
                                </span>
                            </div>
                        );
                    })}

                    {data.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            No data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
