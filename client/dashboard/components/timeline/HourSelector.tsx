import { memo, useEffect, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';


interface HourSelectorProps {
    selectedHour: number;
    onSelectHour: (hour: number) => void;
}

const HourSelector = memo(function HourSelector({ selectedHour, onSelectHour }: HourSelectorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);

    // Initial scroll and selection
    useEffect(() => {
        if (!hasInitialized.current) {
            const currentHour = new Date().getHours();
            if (currentHour !== selectedHour) {
                onSelectHour(currentHour);
            }
            hasInitialized.current = true;
        }
    }, [onSelectHour, selectedHour]);

    // Auto-scroll to selected hour
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const selectedElement = container.children[selectedHour] as HTMLElement;
        if (selectedElement) {
            const containerWidth = container.clientWidth;
            const itemLeft = selectedElement.offsetLeft;
            const itemWidth = selectedElement.offsetWidth;

            const scrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [selectedHour]);

    const scrollContainer = (direction: 'left' | 'right') => {
        if (containerRef.current) {
            const scrollAmount = 300;
            const targetScroll = containerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            containerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="pt-6 pb-2 border-t border-border/40">
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 mx-6">
                    <Clock className="w-3 h-3" />
                    Time Navigator
                </span>
            </div>
            {/* Hour Tabs */}
            <div className="w-full relative group/navigator">
                {/* Left Arrow */}
                <button
                    onClick={() => scrollContainer('left')}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all opacity-0 group-hover/navigator:opacity-100 disabled:opacity-0 -ml-3"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                    ref={containerRef}
                    className="flex gap-2 items-center overflow-x-hidden p-1 mask-linear-fade-ends scroll-smooth"
                >
                    {Array.from({ length: 24 }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onSelectHour(i)}
                            className={`
                                relative px-4 py-2 rounded-full text-xs font-mono font-medium transition-all duration-300 shrink-0 border
                                ${selectedHour === i
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-105 z-10'
                                    : 'bg-card text-muted-foreground border-border/50 hover:border-border hover:bg-accent/50 hover:text-foreground'
                                }
                            `}
                        >
                            {i.toString().padStart(2, '0')}:00
                        </button>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scrollContainer('right')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all opacity-0 group-hover/navigator:opacity-100 disabled:opacity-0 -mr-3"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
});

export default HourSelector;
