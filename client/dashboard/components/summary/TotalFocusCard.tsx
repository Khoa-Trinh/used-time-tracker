import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatTime } from '../../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from 'recharts';

interface TotalFocusCardProps {
    loading?: boolean;
    totalTimeMs: number;
    hourlyActivity: { hour: number; usage: number }[];
}

export const TotalFocusCard = memo(function TotalFocusCard({ loading, totalTimeMs, hourlyActivity }: TotalFocusCardProps) {
    if (loading) {
        return (
            <Card className="bg-card h-48 flex flex-col justify-between border-border/60 shadow-sm relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24 bg-muted" />
                        <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                    </div>

                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <Skeleton className="h-9 w-32 mb-1 bg-muted" />
                            <Skeleton className="h-3 w-20 bg-muted" />
                        </div>
                        <div className="h-12 w-24 sm:w-32">
                            <Skeleton className="h-full w-full rounded-md bg-muted/50" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card h-48 flex flex-col justify-between border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-cyan-500/20">
            {/* Background Chart Effect - only if data exists */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 mask-linear-fade">
                {/* Optional background decoration */}
            </div>

            <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground tracking-wide">Total Focus</span>
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h3 className="text-3xl font-bold text-foreground tracking-tight leading-none mb-1">
                            {formatTime(totalTimeMs)}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">Recorded today</p>
                    </div>

                    <div className="h-12 w-24 sm:w-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyActivity}>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-1.5 shadow-sm text-xs">
                                                    <span className="font-bold text-cyan-500">
                                                        {payload[0].payload.hour}:00
                                                    </span>
                                                    <span className="ml-2 text-muted-foreground">
                                                        {Math.round(Number(payload[0].value) / 60000)}m
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="usage" radius={[2, 2, 0, 0]}>
                                    {hourlyActivity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.usage > 0 ? 'rgb(6 182 212)' : 'transparent'} className="opacity-60 hover:opacity-100 transition-opacity" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
