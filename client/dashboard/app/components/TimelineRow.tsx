import { MoreHorizontal, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatformIcon, StatItem } from '../utils/dashboard-utils';
import { memo, useState } from 'react';

interface TimelineRowProps {
    app: StatItem;
    updateCategory: (appId: string, category: string, previousCategory: string) => void;
    selectedHour: number;
}

const TimelineRow = memo(function TimelineRow({ app, updateCategory, selectedHour }: TimelineRowProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <div className="flex items-center group relative h-12 hover:bg-accent/50 rounded-xl transition-colors px-2 border border-transparent hover:border-border">
            {/* Row Label (Fixed 180px) */}
            <div className="w-[180px] shrink-0 text-sm font-medium truncate pr-6 flex items-center gap-3" title={app.appName}>
                {/* Platform Icon */}
                <div className="shrink-0 p-1.5 rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors" title={app.platforms?.join(', ') || 'Unknown Platform'}>
                    {getPlatformIcon(app.platforms)}
                </div>

                {/* Name + Menu Container - Flex Row Center */}
                <div className="flex-1 min-w-0 flex items-center justify-between mr-4">
                    <span className="truncate text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors pr-2">
                        {app.appName}
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-accent rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:ring-0 shadow-none outline-none shrink-0 data-[state=open]:bg-accent data-[state=open]:text-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-popover border-border" align="end">
                            <DropdownMenuLabel className='text-foreground'>App Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-foreground focus:bg-accent focus:text-accent-foreground">
                                    <span className="mr-2">Category:</span>
                                    <span className={`capitalize font-medium ${app.category === 'productive' ? 'text-emerald-500' :
                                        app.category === 'distracting' ? 'text-red-500' :
                                            app.category === 'neutral' ? 'text-muted-foreground' : 'text-muted-foreground'
                                        }`}>
                                        {app.category}
                                    </span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="bg-popover border-border">
                                        <DropdownMenuItem onClick={() => updateCategory(app.appId, 'uncategorized', app.category)} className="text-muted-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer justify-between group">
                                            Uncategorized
                                            {app.category === 'uncategorized' && <Check className="w-4 h-4 ml-2" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateCategory(app.appId, 'productive', app.category)} className="text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500 cursor-pointer justify-between">
                                            Productive
                                            {app.category === 'productive' && <Check className="w-4 h-4 ml-2" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateCategory(app.appId, 'distracting', app.category)} className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer justify-between">
                                            Distracting
                                            {app.category === 'distracting' && <Check className="w-4 h-4 ml-2" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateCategory(app.appId, 'neutral', app.category)} className="text-muted-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer justify-between">
                                            Neutral
                                            {app.category === 'neutral' && <Check className="w-4 h-4 ml-2" />}
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Timeline Track (Flex-1 fills remaining space) */}
            <div className="flex-1 relative h-full flex items-center">
                {/* Track Baseline */}
                <div className="absolute inset-x-0 h-px bg-border/50" />

                {
                    app.timelines.map((t, tIdx) => {
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
                        const barColor = app.category === 'productive' ? 'from-emerald-500 to-emerald-400 shadow-emerald-500/20' :
                            app.category === 'distracting' ? 'from-red-500 to-red-400 shadow-red-500/20' :
                                'from-blue-500 to-cyan-400 shadow-blue-500/20';

                        if (hoveredIdx === tIdx) {
                            return (
                                <Tooltip key={tIdx} open={true}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`absolute h-3 rounded-full bg-gradient-to-r ${barColor} hover:brightness-125 transition-all cursor-crosshair shadow-sm border border-border/50`}
                                            style={{ left: `${left}%`, width: `${visibleWidth}%` }}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                        />
                                    </TooltipTrigger>
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
                        }

                        return (
                            <div
                                key={tIdx}
                                className={`absolute h-3 rounded-full bg-gradient-to-r ${barColor} hover:brightness-125 transition-all cursor-crosshair shadow-sm border border-border/50`}
                                style={{ left: `${left}%`, width: `${visibleWidth}%` }}
                                onMouseEnter={() => setHoveredIdx(tIdx)}
                            />
                        );
                    })
                }
            </div>
        </div>
    );
});

export default TimelineRow;
