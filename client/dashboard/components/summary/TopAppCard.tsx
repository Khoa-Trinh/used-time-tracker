import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { formatTime, StatItem } from '../../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AppIcon } from '@/components/AppIcon';
import { cn } from '@/lib/utils';
import { useAppCategory } from '@/hooks/use-categories';

interface TopAppCardProps {
    loading?: boolean;
    topApp: StatItem | null;
    totalTimeMs: number;
}

export const TopAppCard = memo(function TopAppCard({ loading, topApp, totalTimeMs }: TopAppCardProps) {
    if (loading) {
        return (
            <Card className="bg-card h-48 flex flex-col justify-between border-border/60 shadow-sm relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28 bg-muted" />
                        <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-5 w-32 bg-muted" />
                                <Skeleton className="h-3 w-20 bg-muted" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Skeleton className="h-4 w-16 bg-muted" />
                                <Skeleton className="h-3 w-12 bg-muted" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full bg-muted" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const percentage = topApp && totalTimeMs > 0 ? Math.min(100, Math.round((topApp.totalTimeMs / totalTimeMs) * 100)) : 0;

    return (
        <Card className="bg-card h-48 flex flex-col justify-between border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-purple-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-500">
                <Trophy className="w-24 h-24 text-purple-500" />
            </div>

            <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground tracking-wide">Most Used App</span>
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                        <Trophy className="w-4 h-4" />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        {topApp ? (
                            <>
                                <AppIcon
                                    appName={topApp.appName}
                                    platform={topApp.platforms?.includes('web') ? 'web' : 'windows'}
                                    size="md"
                                />
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-bold text-foreground truncate leading-none mb-1" title={topApp.appName}>
                                        {topApp.appName}
                                    </h3>
                                    <TopAppCategory app={topApp} />
                                </div>
                            </>
                        ) : (
                            <div className="text-muted-foreground text-sm italic">No apps yet</div>
                        )}
                    </div>

                    {topApp && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-bold text-purple-500 font-mono">
                                    {formatTime(topApp.totalTimeMs)}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">{percentage}% of total</span>
                            </div>
                            <div className="h-1.5 w-full bg-purple-500/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

function TopAppCategory({ app }: { app: StatItem }) {
    const { category } = useAppCategory(app.appId, app.category, app.autoSuggested);

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize truncate max-w-[80px]">
                {category === 'uncategorized' ? 'No Category' : category}
            </span>
        </div>
    );
}
