import { memo } from 'react';

const TimelineGrid = memo(function TimelineGrid() {
    return (
        <div className="absolute inset-0 left-[220px] right-6 h-full pointer-events-none">
            {Array.from({ length: 13 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-dashed border-foreground/5 w-px"
                    style={{ left: `${(i / 12) * 100}%` }}
                />
            ))}
        </div>
    );
});

export default TimelineGrid;
