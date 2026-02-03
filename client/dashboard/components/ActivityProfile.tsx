'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { StatItem, formatTime, IGNORED_APPS } from '@/utils/dashboard-utils';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore } from '@/store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

const COLORS = {
    productive: '#10b981',
    distracting: '#f43f5e',
    neutral: '#3b82f6',
    uncategorized: '#71717a'
};

export default function ActivityProfile() {
    const { stats, isPending: loading } = useDashboardStats();
    const hourlyData = stats?.hourly || {};
    const appsMap = stats?.apps || {};

    const { selectedHour, setSelectedHour, hideBrowsers } = useDashboardStore(useShallow(state => ({
        selectedHour: state.selectedHour,
        setSelectedHour: state.setSelectedHour,
        hideBrowsers: state.hideBrowsers
    })));

    const data = useMemo(() => {
        if (!hourlyData) return [];

        const result = [];
        for (let i = 0; i < 24; i++) {
            let hourItems = hourlyData[i] || [];

            if (hideBrowsers) {
                hourItems = hourItems.filter((item: StatItem) => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
            }

            const hourStats: any = {
                hour: i,
                label: `${i.toString().padStart(2, '0')}:00`,
                productive: 0,
                distracting: 0,
                neutral: 0,
                uncategorized: 0
            };

            hourItems.forEach((app: StatItem) => {
                const liveCategory = appsMap[app.appId];
                const cat = (liveCategory ? liveCategory.category : app.category) || 'uncategorized';

                if (cat in hourStats) {
                    // Convert ms to minutes for chart height
                    hourStats[cat as keyof typeof hourStats] += (app.totalTimeMs / 1000 / 60);
                }
            });

            result.push(hourStats);
        }
        return result;
    }, [hourlyData, hideBrowsers, appsMap]);
    
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

                {/* Chart Skeleton */}
                <div className="h-[300px] w-full p-4 pt-8 flex items-end justify-between px-8 gap-1">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="w-full rounded-t-sm bg-primary/5"
                            style={{ height: `${((i * 13) % 70) + 20}%` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const totalMinutes = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
            return (
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 px-4 py-3 rounded-xl shadow-lg">
                    <p className="font-semibold mb-2 text-foreground">{label}</p>
                    <div className="space-y-1 mb-2">
                        {payload.map((entry: any) => {
                            if (entry.value === 0) return null;
                            return (
                                <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="capitalize text-muted-foreground">{entry.name}</span>
                                    </div>
                                    <span className="font-mono font-medium text-foreground">{Math.round(entry.value)}m</span>
                                </div>
                            );
                        })}
                    </div>
                    {(totalMinutes > 0) && (
                        <div className="border-t border-border/50 pt-2 flex justify-between gap-4 text-sm font-medium text-foreground">
                            <span>Total</span>
                            <span className="font-mono">{Math.round(totalMinutes)}m</span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const CustomXAxisTick = ({ x, y, payload }: any) => {
        const isSelected = payload.value.startsWith(selectedHour.toString().padStart(2, '0'));
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="middle"
                    className={`text-[10px] ${isSelected ? 'fill-primary font-bold' : 'fill-muted-foreground'}`}
                >
                    {payload.value.split(':')[0]}
                </text>
            </g>
        );
    };

    return (
        <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col h-full min-h-[400px]">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 p-8 pb-2 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Activity Profile</h2>
                    <p className="text-xs text-muted-foreground font-medium">24-hour breakdown</p>
                </div>
            </div>

            {/* Content */}
            <div className="h-[300px] w-full p-4 pt-8 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        onClick={(data: any) => {
                            if (data && data.activePayload && data.activePayload.length > 0) {
                                const hour = data.activePayload[0].payload.hour;
                                setSelectedHour(hour);
                            }
                        }}
                        className="cursor-pointer"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                        <XAxis
                            dataKey="label"
                            tick={<CustomXAxisTick />}
                            axisLine={false}
                            tickLine={false}
                            interval={1}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />

                        <Bar dataKey="uncategorized" stackId="a" fill={COLORS.uncategorized} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="distracting" stackId="a" fill={COLORS.distracting} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="productive" stackId="a" fill={COLORS.productive} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
