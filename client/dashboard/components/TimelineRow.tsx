import { memo } from 'react';
import { StatItem } from '../utils/dashboard-utils';
import { useAppCategory } from '@/hooks/use-categories';
import RowLabel from './timeline/RowLabel';
import TimelineTrack from './timeline/TimelineTrack';

interface TimelineRowProps {
    app: StatItem;
    selectedHour: number;
}

const TimelineRow = memo(function TimelineRow({ app, selectedHour }: TimelineRowProps) {
    const { category, autoSuggested } = useAppCategory(app.appId, app.category, app.autoSuggested);

    return (
        <div className="flex items-center group relative h-12 hover:bg-accent/40 rounded-xl transition-all duration-200 mx-2 pr-4 border border-transparent hover:border-border/50 hover:shadow-sm">
            <RowLabel
                app={app}
                category={category}
                autoSuggested={autoSuggested}
            />

            <TimelineTrack
                timelines={app.timelines}
                category={category}
                selectedHour={selectedHour}
            />
        </div>
    );
});

export default TimelineRow;
