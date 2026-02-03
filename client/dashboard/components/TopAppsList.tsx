import { Laptop, Activity } from 'lucide-react';
import { StatItem } from '../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';
import TopAppRow from './TopAppRow';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

const TopAppsList = memo(function TopAppsList() {
    const { stats, isPending: loading } = useDashboardStats();
    const dailyStats = stats?.daily || [];

    if (loading) {
        return (
            <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col h-full min-h-[400px]">
                {/* Header Skeleton */}
                <div className="flex items-center gap-3 p-8 pb-4">
                    <Skeleton className="w-10 h-10 rounded-xl bg-muted" />
                    <div className="space-y-2">
                        <Skeleton className="w-40 h-5 rounded-md bg-muted" />
                        <Skeleton className="w-24 h-3 rounded-md bg-muted" />
                    </div>
                </div>

                {/* Rows Skeleton */}
                <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-8 h-8 rounded-lg bg-muted" />
                                <div className="space-y-2">
                                    <Skeleton className="w-32 h-4 rounded-md bg-muted" />
                                    <Skeleton className="w-20 h-3 rounded-md bg-muted" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Skeleton className="w-12 h-4 rounded-md bg-muted" />
                                <Skeleton className="w-24 h-2 rounded-full bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col h-full min-h-[400px]">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 p-8 pb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <Laptop className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Top Applications</h2>
                    <p className="text-xs text-muted-foreground font-medium">Daily usage breakdown</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative z-10 px-4 pb-4 overflow-hidden">
                {dailyStats.length > 0 ? (
                    <div className="h-full w-full overflow-y-auto custom-scrollbar pr-2">
                        <div className="space-y-2 pr-2">
                            {dailyStats.slice(0, 50).map((app: StatItem, index: number) => (                                                
                                <TopAppRow
                                    key={app.appId}
                                    app={app}
                                    maxTime={dailyStats[0]?.totalTimeMs || 1}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                            <Activity className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">No activity recorded today</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default TopAppsList;
