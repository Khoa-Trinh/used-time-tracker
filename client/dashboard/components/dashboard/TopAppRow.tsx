import { memo } from 'react';
import { formatTime, StatItem } from '../../utils/dashboard-utils';
import { AppIcon } from '@/components/shared/AppIcon';
import { useAppCategory } from '@/hooks/use-categories';
import { Globe, Monitor, Smartphone } from 'lucide-react';

const getPlatformIcon = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) return <Monitor className="w-3.5 h-3.5 text-zinc-600" />;

    // If it has web, show globe (browser activity usually)
    if (platforms.includes('web')) return <Globe className="w-3.5 h-3.5 text-blue-400" />;

    // Mobile
    if (platforms.includes('android') || platforms.includes('ios')) return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;

    // Desktop
    return <Monitor className="w-3.5 h-3.5 text-purple-400" />;
};

const TopAppRow = memo(function TopAppRow({ app, maxTime, index }: { app: StatItem, maxTime: number, index: number }) {
    const { category } = useAppCategory(app.appId, app.category, app.autoSuggested);
    const percentage = Math.min((app.totalTimeMs / maxTime) * 100, 100);
    const rank = index + 1;

    const isProductive = category === 'productive';
    const isDistracting = category === 'distracting';
    const isNeutral = category === 'neutral';

    let progressGradient = 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (isProductive) progressGradient = 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (isDistracting) progressGradient = 'bg-gradient-to-r from-red-500 to-rose-400';
    if (isNeutral) progressGradient = 'bg-gradient-to-r from-zinc-500 to-zinc-400';

    let categoryBadgeClass = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    if (isProductive) categoryBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (isDistracting) categoryBadgeClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';

    const rankColor = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-zinc-400' : rank === 3 ? 'text-amber-700' : 'text-muted-foreground/40';

    return (
        <div className="group flex items-center justify-between p-3 rounded-2xl hover:bg-accent/50 border border-transparent hover:border-border/50 transition-all duration-300 relative overflow-hidden">
            {/* Hover Highlight Layer */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 min-w-0 relative z-10">
                {/* Rank */}
                <span className={`text-sm font-bold font-mono w-6 text-center ${rankColor}`}>#{rank}</span>

                {/* Icon */}
                <div className="relative shrink-0">
                    <div className="rounded-xl shadow-sm overflow-hidden ring-1 ring-border/20 group-hover:scale-105 transition-transform duration-300">
                        <AppIcon
                            appName={app.appName}
                            platform={app.platforms?.includes('web') ? 'web' : 'windows'}
                            size="md"
                        />
                    </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex flex-col gap-1">
                    <h4 className="font-semibold text-sm text-foreground truncate pr-2 group-hover:text-primary transition-colors">{app.appName}</h4>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-transparent ${categoryBadgeClass}`}>
                            {category}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Right */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 relative z-10">
                <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                    {formatTime(app.totalTimeMs)}
                </span>

                {/* Progress Bar */}
                <div className="w-24 sm:w-32 h-2 bg-secondary/50 rounded-full overflow-hidden p-px">
                    <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full shadow-sm ${progressGradient}`}
                    />
                </div>
            </div>
        </div>
    );
});

export default TopAppRow;
