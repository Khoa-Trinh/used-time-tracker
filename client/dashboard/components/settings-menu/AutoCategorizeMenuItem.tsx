import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StatItem } from '../../utils/dashboard-utils';

interface AutoCategorizeMenuItemProps {
    appId: StatItem['appId'];
    appName: StatItem['appName'];
    currentCategory: StatItem['category'];
    onSuggest: (appId: StatItem['appId'], appName: string, currentCategory: StatItem['category']) => Promise<void>;
}

const AutoCategorizeMenuItem = memo(function AutoCategorizeMenuItem({
    appId,
    appName,
    currentCategory,
    onSuggest
}: AutoCategorizeMenuItemProps) {
    return (
        <DropdownMenuItem
            onClick={async () => await onSuggest(appId, appName, currentCategory)}
            className="text-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer text-xs py-2 px-2 rounded-sm"
        >
            <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-500" />
            <span className="font-medium">Auto Categorize</span>
        </DropdownMenuItem>
    );
});

export default AutoCategorizeMenuItem;
