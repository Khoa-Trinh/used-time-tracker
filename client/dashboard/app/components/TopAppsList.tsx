import { motion } from 'framer-motion';
import { Laptop, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime, getPlatformIcon, StatItem } from '../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

interface TopAppsListProps {
    loading: boolean;
    dailyStats: StatItem[];
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const TopAppsList = memo(function TopAppsList({ loading, dailyStats }: TopAppsListProps) {
    if (loading) {
        return (
            <div className="bg-card border border-border p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="w-5 h-5 rounded-md bg-muted" />
                    <Skeleton className="w-40 h-6 rounded-md bg-muted" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-transparent">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-8 h-8 rounded-lg bg-muted" />
                                <div className="space-y-2">
                                    <Skeleton className="w-32 h-4 rounded-md bg-muted" />
                                    <Skeleton className="w-20 h-3 rounded-md bg-muted" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Skeleton className="w-12 h-4 rounded-md bg-muted" />
                                <Skeleton className="w-32 h-1.5 rounded-full bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={item}
            className="bg-card border border-border p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col"
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 shrink-0">
                <Laptop className="w-5 h-5 text-muted-foreground" />
                Top Apps (Daily Total)
            </h2>

            {dailyStats.length > 0 ? (
                <ScrollArea className="h-[500px] w-full pr-4">
                    <div className="space-y-3">
                        {dailyStats.slice(0, 10).map((app, index) => {
                            const maxTime = dailyStats[0]?.totalTimeMs || 1;
                            const percentage = (app.totalTimeMs / maxTime) * 100;

                            const isProductive = app.category === 'productive';
                            const isDistracting = app.category === 'distracting';

                            const progressColor = isProductive
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : isDistracting
                                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-400';

                            return (
                                <div
                                    key={app.appId}
                                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-accent border border-transparent hover:border-border transition-all"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 text-muted-foreground font-mono text-sm group-hover:bg-accent group-hover:text-foreground transition-colors">
                                            {index + 1}
                                        </div>

                                        <div className="min-w-0">
                                            <h4 className="font-medium text-card-foreground truncate pr-4">{app.appName}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                {getPlatformIcon(app.platforms)}
                                                <span className="capitalize">{app.category}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className="font-mono text-sm font-medium text-foreground">
                                            {formatTime(app.totalTimeMs)}
                                        </span>
                                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                                className={`h-full rounded-full ${progressColor}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="w-12 h-12 mb-4 opacity-20" />
                    <p>No activity found.</p>
                </div>
            )}
        </motion.div>
    );
});

export default TopAppsList;
