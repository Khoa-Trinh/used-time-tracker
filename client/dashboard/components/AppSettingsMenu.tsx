import { memo, useCallback } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatItem } from '../utils/dashboard-utils';
import { useCategoryMutations } from '@/hooks/use-categories';
import AutoCategorizeMenuItem from './settings-menu/AutoCategorizeMenuItem';
import CategorySubMenu from './settings-menu/CategorySubMenu';

interface AppSettingsMenuProps {
    app: StatItem;
    category: StatItem['category'];
    autoSuggested: StatItem['autoSuggested'];
}

const AppSettingsMenu = memo(function AppSettingsMenu({
    app,
    category,
    autoSuggested
}: AppSettingsMenuProps) {
    const { updateCategory, suggestCategory } = useCategoryMutations();

    const handleUpdateCategory = useCallback((appId: StatItem['appId'], newCategory: StatItem['category'], previousCategory: StatItem['category'], autoSuggested?: boolean) => {
        updateCategory({ appId, category: newCategory, autoSuggested });
    }, [updateCategory]);

    const handleSuggestCategory = useCallback(async (appId: StatItem['appId'], appName: string, currentCategory: StatItem['category']) => {
        await suggestCategory({ appId, appName });
    }, [suggestCategory]);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="h-6 w-6 p-0 bg-transparent hover:bg-foreground/10 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-all cursor-pointer ring-0 outline-none data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground border-none">
                <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background/80 backdrop-blur-xl border-border/50 shadow-xl p-1" align="end" sideOffset={8}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    Settings
                </div>
                <AutoCategorizeMenuItem
                    appId={app.appId}
                    appName={app.appName}
                    currentCategory={category}
                    onSuggest={handleSuggestCategory}
                />

                <div className="h-px bg-border/50 my-1 mx-1" />

                <CategorySubMenu
                    appId={app.appId}
                    category={category}
                    autoSuggested={autoSuggested}
                    onUpdate={handleUpdateCategory}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

export default AppSettingsMenu;
