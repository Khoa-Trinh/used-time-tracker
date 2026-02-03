import { memo } from 'react';

interface TimelineHeaderProps {
    selectedHour: number;
}

const TimelineHeader = memo(function TimelineHeader({ selectedHour }: TimelineHeaderProps) {
    return (
        <div className="relative h-12 border-b border-border/50 mb-2 w-full bg-background/50 backdrop-blur-md z-20">
            {/* Spacer for App Name Column - Increased width */}
            <div className="absolute left-0 top-0 bottom-0 w-[220px] flex items-center px-6">
                <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">Application</span>
            </div>

            {/* The Timeline Track Area */}
            <div className="absolute left-[220px] right-6 top-0 bottom-0">
                {Array.from({ length: 13 }).map((_, i) => {
                    const minutes = i * 5;
                    const displayHour = (selectedHour + Math.floor(minutes / 60)) % 24;
                    const displayMinute = minutes % 60;
                    // Only show labels every 10 mins (every 2nd tick)
                    if (i % 2 !== 0) return null;

                    return (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 flex flex-col items-center justify-center pt-1 transform -translate-x-1/2"
                            style={{ left: `${(i / 12) * 100}%` }}
                        >
                            {/* Tick mark */}
                            <div className="w-px h-1.5 bg-border top-0 absolute" />

                            <span className="text-[10px] text-muted-foreground/60 font-mono font-medium mt-1">
                                {displayHour.toString().padStart(2, '0')}:{displayMinute.toString().padStart(2, '0')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default TimelineHeader;
