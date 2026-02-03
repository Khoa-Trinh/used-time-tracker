import { memo } from 'react';
import { Check } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { StatItem } from '../../utils/dashboard-utils';

interface CategorySubMenuProps {
    appId: StatItem['appId'];
    category: StatItem['category'];
    autoSuggested?: boolean;
    onUpdate: (appId: StatItem['appId'], newCategory: StatItem['category'], previousCategory: StatItem['category'], autoSuggested?: boolean) => void;
}

const CategorySubMenu = memo(function CategorySubMenu({
    appId,
    category,
    autoSuggested,
    onUpdate
}: CategorySubMenuProps) {
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-foreground focus:bg-accent/50 focus:text-accent-foreground text-xs py-2 px-2 rounded-sm cursor-pointer">
                <span>Set Category</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-background/90 backdrop-blur-xl border-border/50 shadow-xl p-1 min-w-[160px]" sideOffset={10}>
                    <DropdownMenuItem onClick={() => onUpdate(appId, 'uncategorized', category)} className="text-muted-foreground focus:bg-accent/50 focus:text-accent-foreground cursor-pointer justify-between group text-xs py-2 rounded-sm">
                        <span>Uncategorized</span>
                        {category === 'uncategorized' && <Check className="w-3.5 h-3.5 ml-2" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onUpdate(appId, 'productive', category)} className="text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-600 dark:focus:text-emerald-300 cursor-pointer justify-between text-xs py-2 rounded-sm">
                        <span>Productive</span>
                        {category === 'productive' && <Check className="w-3.5 h-3.5 ml-2" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onUpdate(appId, 'distracting', category)} className="text-red-600 dark:text-red-400 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-300 cursor-pointer justify-between text-xs py-2 rounded-sm">
                        <span>Distracting</span>
                        {category === 'distracting' && <Check className="w-3.5 h-3.5 ml-2" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onUpdate(appId, 'neutral', category)} className="text-foreground/80 focus:bg-accent/50 focus:text-foreground cursor-pointer justify-between text-xs py-2 rounded-sm">
                        <span>Neutral</span>
                        {category === 'neutral' && <Check className="w-3.5 h-3.5 ml-2" />}
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
});

export default CategorySubMenu;
