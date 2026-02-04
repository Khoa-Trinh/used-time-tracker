import { memo, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from 'framer-motion';

interface TimelineSegmentProps {
    t: { startTime: string; endTime: string };
    category: string;
    selectedHour: number;
}

const TimelineSegment = memo(function TimelineSegment({ t, category, selectedHour }: TimelineSegmentProps) {
    const start = new Date(t.startTime);
    const end = new Date(t.endTime);

    // Calculate minutes visible in THIS hour
    let startMin = 0;
    if (start.getHours() === selectedHour) {
        startMin = start.getMinutes() + start.getSeconds() / 60;
    } else if (start.getHours() > selectedHour) {
        startMin = 60;
    } else {
        startMin = 0;
    }

    let endMin = 60;
    if (end.getHours() === selectedHour) {
        endMin = end.getMinutes() + end.getSeconds() / 60;
    } else if (end.getHours() < selectedHour) {
        endMin = 0;
    } else {
        endMin = 60;
    }

    const durationMins = endMin - startMin;
    if (durationMins <= 0) return null;

    const left = (startMin / 60) * 100;
    let width = (durationMins / 60) * 100;

    // Visual minimum
    const visibleWidth = Math.max(width, 0.2);

    // Color based on category
    const barColor = category === 'productive' ? 'from-emerald-500 to-emerald-400 shadow-emerald-500/20' :
        category === 'distracting' ? 'from-red-500 to-red-400 shadow-red-500/20' :
            'from-blue-500 to-cyan-400 shadow-blue-500/20';

    const triggerElement = useMemo(() => (
        <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.1
            }}
            style={{
                left: `${left}%`,
                width: `${visibleWidth}%`,
                originX: 0
            }}
            className={`absolute h-3 rounded-full bg-linear-to-r ${barColor} hover:brightness-125 transition-all cursor-crosshair shadow-sm border border-border/50`}
        />
    ), [barColor, left, visibleWidth]);

    return (
        <Tooltip>
            <TooltipTrigger render={triggerElement} />
            <TooltipContent side="top" className="text-xs p-2">
                <p className="font-semibold mb-0.5">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-muted-foreground">
                    {Math.round(durationMins)} min
                </p>
            </TooltipContent>
        </Tooltip>
    );
});

export default TimelineSegment;

