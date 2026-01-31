import { MoreHorizontal, Check, Sparkles } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPlatformIcon, StatItem } from '../utils/dashboard-utils';
import { AppIcon } from '@/components/AppIcon';
import { memo, useMemo } from 'react';
import { useAppCategory, useCategoryStore } from '../store/category-store';

interface TimelineRowProps {
    app: StatItem;
    // Actions are now retrieved from store hook
    // updateCategory: (appId: string, category: string, previousCategory: string, autoSuggested?: boolean) => void;
    // suggestAppCategory: (appId: string, appName: string) => Promise<void>;
    selectedHour: number;
}

// Extracted TimelineSegment to isolate hover state and prevent full row re-renders
const TimelineSegment = memo(function TimelineSegment({ t, category, selectedHour }: {
    t: { startTime: string; endTime: string };
    category: string;
    selectedHour: number
}) {

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
        <div
            className={`absolute h-3 rounded-full bg-gradient-to-r ${barColor} hover:brightness-125 transition-all cursor-crosshair shadow-sm border border-border/50`}
            style={{ left: `${left}%`, width: `${visibleWidth}%` }}
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

const AppSettingsMenu = memo(function AppSettingsMenu({
    app,
    category,
    autoSuggested,
    updateCategory,
    suggestAppCategory
}: {
    app: StatItem,
    category: string,
    autoSuggested?: boolean,
    updateCategory: (appId: string, category: string, previousCategory: string, autoSuggested?: boolean) => void,
    suggestAppCategory: (appId: string, appName: string, currentCategory: string) => Promise<void>
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-accent rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:ring-0 shadow-none outline-none shrink-0 data-[state=open]:bg-accent data-[state=open]:text-foreground">
                <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border" align="end">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className='text-foreground'>App Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />

                    <DropdownMenuItem
                        onClick={() => suggestAppCategory(app.appId, app.appName, category)}
                        className="cursor-pointer text-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                        <span>Auto Categorize</span>
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-foreground focus:bg-accent focus:text-accent-foreground">
                            <span className="mr-2">{autoSuggested ? 'Auto-Category:' : 'Category:'}</span>
                            <span className={`capitalize font-medium ${category === 'productive' ? 'text-emerald-500' :
                                category === 'distracting' ? 'text-red-500' :
                                    category === 'neutral' ? 'text-muted-foreground' : 'text-muted-foreground'
                                }`}>
                                {category}
                            </span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent className="bg-popover border-border">
                                <DropdownMenuItem onClick={() => updateCategory(app.appId, 'uncategorized', category)} className="text-muted-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer justify-between group">
                                    Uncategorized
                                    {category === 'uncategorized' && <Check className="w-4 h-4 ml-2" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCategory(app.appId, 'productive', category)} className="text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500 cursor-pointer justify-between">
                                    Productive
                                    {category === 'productive' && <Check className="w-4 h-4 ml-2" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCategory(app.appId, 'distracting', category)} className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer justify-between">
                                    Distracting
                                    {category === 'distracting' && <Check className="w-4 h-4 ml-2" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCategory(app.appId, 'neutral', category)} className="text-muted-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer justify-between">
                                    Neutral
                                    {category === 'neutral' && <Check className="w-4 h-4 ml-2" />}
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

const TimelineRow = memo(function TimelineRow({ app, selectedHour }: TimelineRowProps) {
    const { category, autoSuggested } = useAppCategory(app.appId, app.category, app.autoSuggested);
    const updateCategory = useCategoryStore(state => state.updateCategory);
    const suggestAppCategory = useCategoryStore(state => state.suggestAppCategory);

    return (
        <div className="flex items-center group relative h-12 hover:bg-accent/50 rounded-xl transition-colors px-2 border border-transparent hover:border-border">
            {/* Row Label (Fixed 180px) */}
            <div className="w-[180px] shrink-0 text-sm font-medium truncate pr-6 flex items-center gap-3" title={app.appName}>
                {/* App Icon */}
                <AppIcon
                    appName={app.appName}
                    platform={app.platforms?.includes('web') ? 'web' : 'windows'}
                    size="md"
                />

                {/* Name + Menu Container - Flex Row Center */}
                <div className="flex-1 min-w-0 flex items-center justify-between mr-4 gap-2">
                    <span className="truncate text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
                        {app.appName}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Tooltip>
                            <TooltipTrigger render={
                                <Badge
                                    variant="outline"
                                    className={`px-1.5 py-0 text-[10px] h-5 font-normal capitalize border-transparent transition-colors flex items-center gap-1 shadow-none ${category === 'productive' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                                        category === 'distracting' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                                            'bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    {autoSuggested && category !== 'uncategorized' && <Sparkles className="w-2.5 h-2.5" />}
                                    {category === 'uncategorized' ? 'None' : category}
                                </Badge>
                            } />
                            <TooltipContent side="top" className="text-[10px] py-1 px-2">
                                <p>
                                    {autoSuggested ? 'Auto-categorized' : 'Manual category'}
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        <AppSettingsMenu
                            app={app}
                            category={category}
                            autoSuggested={autoSuggested}
                            updateCategory={updateCategory}
                            suggestAppCategory={suggestAppCategory}
                        />
                    </div>
                </div>
            </div>

            {/* Timeline Track (Flex-1 fills remaining space) */}
            <div className="flex-1 relative h-full flex items-center">
                {/* Track Baseline */}
                <div className="absolute inset-x-0 h-px bg-border/50" />

                {
                    app.timelines.map((t, tIdx) => (
                        <TimelineSegment
                            key={tIdx}
                            t={t}
                            category={category}
                            selectedHour={selectedHour}
                        />
                    ))
                }
            </div>
        </div>
    );
});

export default TimelineRow;
