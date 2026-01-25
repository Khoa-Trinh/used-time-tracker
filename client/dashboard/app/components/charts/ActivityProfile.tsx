'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatItem, formatTime } from '@/app/utils/dashboard-utils';
import { BarChart3 } from 'lucide-react';
import { useDashboardStore } from '@/app/store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';

const COLORS = {
    productive: '#10b981',
    distracting: '#ef4444',
    neutral: '#3b82f6',
    uncategorized: '#71717a'
};

export default function ActivityProfile() {
    const { hourlyData, selectedHour, setSelectedHour } = useDashboardStore(useShallow(state => ({
        hourlyData: state.hourlyData,
        selectedHour: state.selectedHour,
        setSelectedHour: state.setSelectedHour
    })));

    const data = useMemo(() => {
        // Transform hourlyData (Record<number, StatItem[]>) into array for Recharts
        // Array [{ hour: '09:00', productive: 12000, distracting: 5000 ... }]
        const result = [];
        for (let i = 0; i < 24; i++) {
            const hourItems = hourlyData[i] || [];
            const hourStats: any = {
                hour: i,
                label: `${i.toString().padStart(2, '0')}:00`,
                productive: 0,
                distracting: 0,
                neutral: 0,
                uncategorized: 0
            };

            hourItems.forEach(app => {
                const cat = app.category || 'uncategorized';
                if (cat in hourStats) {
                    // Recharts bar size depends on value. We want minutes or milliseconds?
                    // Milliseconds is huge. Let's convert to Minutes for the chart value so tooltip is readable raw, 
                    // but we'll format tooltip anyway.
                    // Using Minutes for Y-Axis scale.
                    // Wait, formatTime is HH:MM:SS.
                    // Aggregating in Minutes.
                    hourStats[cat as keyof typeof hourStats] += (app.totalTimeMs / 1000 / 60);
                }
            });

            // Only add if there is data? No, show empty hours too for context.
            result.push(hourStats);
        }
        return result;
    }, [hourlyData]);

    // console.log('[Charts] Activity Profile Data:', data);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const totalMinutes = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
            return (
                <div className="bg-foreground text-background px-3 py-1.5 rounded-md shadow-md text-xs">
                    <p className="font-medium mb-1">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="capitalize text-muted-foreground">{entry.name}:</span>
                            <span className="font-mono">{Math.round(entry.value)}m</span>
                        </div>
                    ))}
                    <div className="border-t border-background/20 mt-1 pt-1 font-medium flex justify-between gap-4">
                        <span>Total:</span>
                        <span>{Math.round(totalMinutes)}m</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-card border-border shadow-sm flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    Activity Profile (24h)
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full p-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        onClick={(data: any) => {
                            if (data && data.activePayload && data.activePayload.length > 0) {
                                const hour = data.activePayload[0].payload.hour;
                                setSelectedHour(hour);
                            }
                        }}
                        className="cursor-pointer"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            interval={3} // Show every 3rd or 4th label
                        />
                        <YAxis
                            hide // Hide Y axis labels to keep clean, or show minimal?
                        // unit="m"
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }} />
                        <Legend verticalAlign="top" align="right" height={36} iconSize={8} formatter={(val) => <span className="capitalize text-xs text-muted-foreground">{val}</span>} />

                        <Bar dataKey="productive" stackId="a" fill={COLORS.productive} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="distracting" stackId="a" fill={COLORS.distracting} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="uncategorized" stackId="a" fill={COLORS.uncategorized} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
