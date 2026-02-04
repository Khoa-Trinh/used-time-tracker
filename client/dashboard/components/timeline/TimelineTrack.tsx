import { memo } from 'react';
import { StatItem } from '../../utils/dashboard-utils';
import TimelineSegment from './TimelineSegment';

interface TimelineTrackProps {
    timelines: StatItem['timelines'];
    category: StatItem['category'];
    selectedHour: number;
}

const TimelineTrack = memo(function TimelineTrack({ timelines, category, selectedHour }: TimelineTrackProps) {
    return (
        <div className="flex-1 relative h-full flex items-center">
            {/* Track Baseline */}
            <div className="absolute inset-x-0 h-px bg-border/50" />

            {
                timelines.map((t, tIdx) => (
                    <TimelineSegment
                        key={tIdx}
                        t={t}
                        category={category}
                        selectedHour={selectedHour}
                    />
                ))
            }
        </div>
    );
});

export default TimelineTrack;
