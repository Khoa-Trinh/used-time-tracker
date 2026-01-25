import { motion } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { IGNORED_APPS } from '../utils/dashboard-utils';
import TimelineRow from './TimelineRow';
import { Skeleton } from '@/components/ui/skeleton';
import { memo, useMemo } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const HourlyTimeline = memo(function HourlyTimeline() {
    const {
        loading,
        selectedHour,
        setSelectedHour,
        updateCategory,
        hourlyData,
        hideBrowsers
    } = useDashboardStore(useShallow(state => ({
        loading: state.loading,
        selectedHour: state.selectedHour,
        setSelectedHour: state.setSelectedHour,
        updateCategory: state.updateCategory,
        hourlyData: state.hourlyData,
        hideBrowsers: state.hideBrowsers
    })));

    const currentHourStats = useMemo(() => {
        let stats = hourlyData[selectedHour] || [];
        if (hideBrowsers) {
            stats = stats.filter(item => !IGNORED_APPS.some(ignored => item.appName.toLowerCase().includes(ignored.toLowerCase())));
        }
        return stats;
    }, [hourlyData, selectedHour, hideBrowsers]);

    if (loading) {
        return (
            <div className="bg-card border border-border p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col h-[600px]">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="w-5 h-5 rounded-md bg-muted" />
                    <Skeleton className="w-32 h-6 rounded-md bg-muted" />
                </div>
                <div className="space-y-4 flex-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="w-[180px] h-10 rounded-xl bg-muted" />
                            <Skeleton className="flex-1 h-10 rounded-xl bg-muted" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={item}
            className="bg-card border border-border p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[800px]"
        >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 shrink-0">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Hourly Activity
            </h2>

            <ScrollArea className="flex-1 pr-2 mb-4">
                {/* Force min-width to ensure horizontal scroll if truncated */}
                <div className="min-w-[1000px] relative pb-4">

                    {/* Timeline Header - Aligned Physically with Rows */}
                    {/* 180px padding on left for app names, then the rest is 1 hour */}
                    <div className="relative h-10 border-b border-border mb-2 w-full sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm">
                        {/* 180px Spacer for App Name Column */}
                        <div className="absolute left-0 top-0 bottom-0 w-[180px] flex items-center px-4">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Application</span>
                        </div>

                        {/* The Timeline Track Area */}
                        <div className="absolute left-[180px] right-0 top-0 bottom-0">
                            {Array.from({ length: 13 }).map((_, i) => {
                                const minutes = i * 5;
                                const displayHour = (selectedHour + Math.floor(minutes / 60)) % 24;
                                const displayMinute = minutes % 60;
                                // Only show labels every 10 mins to reduce clutter, or keep 5 if space allows. 
                                // Let's hide 05, 15, 25... for cleaner look
                                if (i % 2 !== 0) return null;

                                return (
                                    <div
                                        key={i}
                                        className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-2 transform -translate-x-1/2"
                                        style={{ left: `${(i / 12) * 100}%` }}
                                    >
                                        <span className="text-[10px] text-muted-foreground font-mono font-medium">
                                            {displayHour.toString().padStart(2, '0')}:{displayMinute.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Background Grid - Absolutely Positioned */}
                        <div className="absolute inset-0 left-[180px] right-0 h-full pointer-events-none opacity-[0.03]">
                            {Array.from({ length: 13 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-border w-px"
                                    style={{ left: `${(i / 12) * 100}%` }}
                                />
                            ))}
                        </div>

                        {/* Apps Timeline */}
                        <div
                            className="space-y-1 relative z-10"
                            style={{
                                contentVisibility: 'auto',
                                containIntrinsicSize: 'auto 500px' // Estimate height to preventing scroll jumping
                            }}
                        >
                            {currentHourStats.length > 0 ? currentHourStats.map((app, idx) => (
                                <TimelineRow
                                    key={app.appId || idx}
                                    app={app}
                                    updateCategory={updateCategory}
                                    selectedHour={selectedHour}
                                />
                            )) : (
                                <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl mx-4">
                                    <Clock className="w-10 h-10 mb-3 opacity-20" />
                                    <p className="font-medium text-muted-foreground">No activity recorded</p>
                                    <p className="text-sm mt-1">for {selectedHour.toString().padStart(2, '0')}:00</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>

            <div className="pt-4 border-t border-border mx-6">
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Range</span>
                </div>
                {/* Hour Tabs */}
                <ScrollArea className="w-full bg-muted/30 rounded-xl border border-border">
                    <div className="flex p-1">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedHour(i)}
                                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all shrink-0 border border-transparent ${selectedHour === i
                                    ? 'bg-background text-foreground border-border shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                {i.toString().padStart(2, '0')}:00
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-2.5" />
                </ScrollArea>
            </div>
        </motion.div >
    );
});

export default HourlyTimeline;
