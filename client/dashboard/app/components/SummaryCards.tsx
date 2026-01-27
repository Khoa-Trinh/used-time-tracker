import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Trophy, Activity } from 'lucide-react';
import { RadialProgress } from './charts/RadialProgress';
import { formatTime, StatItem } from '../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

interface SummaryCardsProps {
    loading: boolean;
    totalTimeMs: number;
    topApp: StatItem | null;
    productivityScore: number;
    productiveMs: number;
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const SummaryCards = memo(function SummaryCards({
    loading,
    totalTimeMs,
    topApp,
    productivityScore,
    productiveMs
}: SummaryCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                            <Skeleton className="h-4 w-24 bg-muted" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-32 bg-muted" />
                            <Skeleton className="h-3 w-20 bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Focus Card */}
            <motion.div variants={item}>
                <Card className="bg-card border-border backdrop-blur-md shadow-sm hover:bg-accent/50 transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-24 h-24 text-cyan-500" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-muted-foreground font-medium text-sm">Total Focus</span>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold text-card-foreground tracking-tight">
                                {formatTime(totalTimeMs)}
                            </h3>
                            <p className="text-muted-foreground text-xs mt-2">Recorded today</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Top Application Card */}
            <motion.div variants={item}>
                <Card className="bg-card border-border backdrop-blur-md shadow-sm hover:bg-accent/50 transition-colors relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trophy className="w-24 h-24 text-purple-500" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <span className="text-muted-foreground font-medium text-sm">Top App</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-card-foreground truncate pr-4" title={topApp?.appName}>
                                {topApp?.appName || '-'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-purple-500 font-mono text-sm font-medium">
                                    {topApp ? formatTime(topApp.totalTimeMs) : '-'}
                                </span>
                                {topApp && (
                                    <span className="text-muted-foreground text-xs">• {topApp.category}</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Productivity Score Card */}
            <motion.div variants={item}>
                <Card className="bg-card border-border backdrop-blur-md shadow-sm hover:bg-accent/50 transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <span className="text-muted-foreground font-medium text-sm">Productivity</span>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-3xl font-bold text-card-foreground">{productivityScore}</h3>
                                    <span className="text-muted-foreground text-sm">/100</span>
                                </div>
                                <p className="text-emerald-500/80 text-xs mt-2 font-medium">
                                    {formatTime(productiveMs)} Productive
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <RadialProgress score={productivityScore} size={80} strokeWidth={8} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
});

export default SummaryCards;
