import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppIcon } from '@/components/AppIcon';
import AppSettingsMenu from '../AppSettingsMenu';
import { StatItem } from '../../utils/dashboard-utils';

interface RowLabelProps {
    app: StatItem;
    category: StatItem['category'];
    autoSuggested: StatItem['autoSuggested'];
}

const RowLabel = memo(function RowLabel({
    app,
    category,
    autoSuggested
}: RowLabelProps) {
    return (
        <div className="w-[220px] shrink-0 pr-6 flex items-center gap-3 relative" title={app.appName}>
            {/* App Icon */}
            <div className="shrink-0 relative group/icon">
                <AppIcon
                    appName={app.appName}
                    platform={app.platforms?.includes('web') ? 'web' : 'windows'}
                    size="md"
                    className="rounded-lg shadow-sm ml-2"
                />
            </div>

            {/* Name + Menu Container */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-tight">
                        {app.appName}
                    </span>
                </div>

                <div className="flex items-center mt-0.5 h-4">
                    <Tooltip>
                        <TooltipTrigger className="cursor-default outline-none text-left">
                            <span
                                className={`
                                    text-[10px] font-medium truncate max-w-full inline-flex items-center gap-1 transition-colors
                                    ${category === 'productive' ? 'text-emerald-600 dark:text-emerald-400' :
                                        category === 'distracting' ? 'text-red-500 dark:text-red-400' :
                                            'text-muted-foreground/60'}
                                `}
                            >
                                {autoSuggested && category !== 'uncategorized' && <Sparkles className="w-2 h-2 shrink-0 opacity-70" />}
                                <span className="truncate">{category === 'uncategorized' ? 'Uncategorized' : category}</span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-[10px]">
                            {autoSuggested ? 'Auto-categorized by AI' : 'Manually categorized'}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Floating Action Menu - Visible on Hover */}
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                <AppSettingsMenu
                    app={app}
                    category={category}
                    autoSuggested={autoSuggested}
                />
            </div>
        </div>
    );
});

export default RowLabel;
