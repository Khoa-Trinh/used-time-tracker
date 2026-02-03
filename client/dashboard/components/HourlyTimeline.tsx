import { Activity, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { IGNORED_APPS } from '../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { memo, useMemo, useRef, useCallback } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';
import { StatItem } from '../utils/dashboard-utils';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import RowLabel from './timeline/RowLabel';
import TimelineTrack from './timeline/TimelineTrack';
import HourSelector from './timeline/HourSelector';
import { useAppCategory } from '@/hooks/use-categories';

// Unified Row Component containing both the sticky app info and the timeline track
const UnifiedRow = memo(function UnifiedRow({ app, selectedHour }: { app: StatItem, selectedHour: number }) {
    const { category, autoSuggested } = useAppCategory(app.appId, app.category, app.autoSuggested);

    return (
        <div className="flex h-14 w-full group min-w-max border-b border-border/5 hover:bg-muted/5 transition-colors">
            {/* Sticky Left Column: App Info */}
            <div className="sticky left-0 w-[240px] z-20 flex-none bg-background/40 backdrop-blur-md flex items-center pl-6 pr-4 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-colors group-hover:bg-accent/5">
                <RowLabel
                    app={app}
                    category={category}
                    autoSuggested={autoSuggested}
                />
            </div>

            {/* Scrollable Right Content */}
            <div className="flex-1 min-w-[1000px] h-full relative px-12 flex items-center">
                <TimelineTrack
                    timelines={app.timelines}
                    category={category}
                    selectedHour={selectedHour}
                />
            </div>
        </div>
    );
});

const HourlyTimeline = memo(function HourlyTimeline() {
    const { stats, isPending: loading } = useDashboardStats();
    const hourlyData = stats.hourly || {};
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const {
        selectedHour,
        setSelectedHour,
        hideBrowsers
    } = useDashboardStore(useShallow(state => ({
        selectedHour: state.selectedHour,
        setSelectedHour: state.setSelectedHour,
        hideBrowsers: state.hideBrowsers
    })));

    const currentHourStats = useMemo(() => {
        if (!hourlyData) return [];

        let stats = hourlyData[selectedHour] || [];
        if (hideBrowsers) {
            stats = stats.filter((item: StatItem) => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
        }
        return stats;
    }, [hourlyData, selectedHour, hideBrowsers]);

    const handleArrowScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const amount = 100;
            const currentLeft = scrollContainerRef.current.scrollLeft;
            scrollContainerRef.current.scrollTo({
                left: currentLeft + (direction === 'left' ? -amount : amount),
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-[300px]">
                <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col flex-1">
                    {/* Header Skeleton */}
                    <div className="flex items-center gap-3 p-8 pb-4 border-b border-border/5">
                        <Skeleton className="w-10 h-10 rounded-xl bg-primary/10" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48 bg-primary/10" />
                            <Skeleton className="h-3 w-32 bg-primary/5" />
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="flex-1 overflow-hidden relative">
                        {/* Fake Header Row */}
                        <div className="h-14 border-b border-border/50 bg-background/5 sticky top-0 flex">
                            <div className="w-[240px] border-r border-border/5" />
                            <div className="flex-1" />
                        </div>

                        {/* Rows */}
                        <div className="relative">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex h-14 border-b border-border/5">
                                    {/* Left Column Skeleton */}
                                    <div className="w-[240px] px-6 flex items-center gap-3 border-r border-border/5 bg-background/5">
                                        <Skeleton className="w-8 h-8 rounded-lg bg-muted/20" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3 w-32 bg-muted/20" />
                                            <Skeleton className="h-2 w-20 bg-muted/10" />
                                        </div>
                                    </div>
                                    {/* Right Content Skeleton (Random bars) */}
                                    <div className="flex-1 px-12 flex items-center">
                                        <Skeleton className="h-6 rounded-md bg-muted/5 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="bg-card/40 border border-border/50 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col flex-1">
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-3 p-8 pb-4 relative z-10 border-b border-border/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Activity Timeline</h2>
                        <p className="text-xs text-muted-foreground font-medium">Minute-by-minute usage breakdown</p>
                    </div>
                </div>

                {/* Main Scrollable Area (Handles both X and Y scrolling natively) */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-x-hidden relative group/timeline"
                >
                    {/* Floating Navigation Arrows */}
                    <div className="fixed top-1/2 -translate-y-1/2 right-8 z-50 opacity-0 group-hover/timeline:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="flex gap-2 pointer-events-auto">
                            <button
                                onClick={() => handleArrowScroll('left')}
                                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105 transition-all"
                                aria-label="Scroll left"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleArrowScroll('right')}
                                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105 transition-all"
                                aria-label="Scroll right"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="min-w-max pb-4">
                        {/* Sticky Header Row */}
                        <div className="sticky top-0 z-30 flex h-14 border-b border-border/50 bg-background/85 backdrop-blur-xl">

                            {/* Sticky Corner (Top-Left) */}
                            <div className="sticky left-0 w-[240px] flex-none z-40 bg-background/95 backdrop-blur-xl flex items-center px-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Application</span>
                            </div>

                            {/* Scrollable Header Part */}
                            <div className="flex-1 min-w-[1000px] relative px-12">
                                <div className="absolute inset-x-12 top-0 bottom-0">
                                    {Array.from({ length: 13 }).map((_, i) => {
                                        const minutes = i * 5;
                                        const displayHour = (selectedHour + Math.floor(minutes / 60)) % 24;
                                        const displayMinute = minutes % 60;
                                        const isMajor = i % 2 === 0;

                                        return (
                                            <div
                                                key={i}
                                                className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-2 transform -translate-x-1/2"
                                                style={{ left: `${(i / 12) * 100}%` }}
                                            >
                                                {/* Label (Only for Major) */}
                                                {isMajor && (
                                                    <span className="text-[10px] text-muted-foreground/80 font-mono font-medium select-none">
                                                        {displayHour.toString().padStart(2, '0')}:{displayMinute.toString().padStart(2, '0')}
                                                    </span>
                                                )}

                                                {/* Tick Mark */}
                                                <div className={`w-px bg-foreground/15 ${isMajor ? 'h-3' : 'h-1.5 opacity-40'}`} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Body Content */}
                        <div className="relative">
                            {/* Grid Lines Layer (Behind content, full width) */}
                            <div className="absolute inset-0 left-[240px] pointer-events-none z-0">
                                <div className="absolute inset-x-12 top-0 bottom-0">
                                    {Array.from({ length: 13 }).map((_, i) => {
                                        const isMajor = i % 2 === 0;
                                        return (
                                            <div
                                                key={i}
                                                className={`absolute top-0 bottom-0 w-px border-l ${isMajor ? 'border-foreground/10' : 'border-dashed border-foreground/5'}`}
                                                style={{ left: `${(i / 12) * 100}%` }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rows */}
                            <div className="relative z-10">
                                {currentHourStats.length > 0 ? currentHourStats.map((app: StatItem, idx: number) => (
                                    <UnifiedRow
                                        key={app.appId || idx}
                                        app={app}
                                        selectedHour={selectedHour}
                                    />
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-20 ml-[240px] border-2 border-dashed border-border/30 rounded-3xl m-8 bg-muted/5">
                                        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                            <Clock className="w-8 h-8 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-muted-foreground">No activity recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <HourSelector selectedHour={selectedHour} onSelectHour={setSelectedHour} />
            </div>
        </div>
    );
});

export default HourlyTimeline;
