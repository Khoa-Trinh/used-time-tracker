import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '../../store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';
import { Globe, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BrowserToggle = memo(function BrowserToggle() {
    const { hideBrowsers, setHideBrowsers } = useDashboardStore(useShallow(state => ({
        hideBrowsers: state.hideBrowsers,
        setHideBrowsers: state.setHideBrowsers
    })));

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => setHideBrowsers(!hideBrowsers)}
            className={cn(
                "h-9 px-3 gap-2 rounded-xl text-xs font-medium transition-all duration-200",
                hideBrowsers
                    ? "bg-blue-500/10! text-blue-500! border-blue-500/20! hover:bg-blue-500/20! hover:border-blue-500/30! shadow-none"
                    : "text-muted-foreground! hover:text-foreground!"
            )}
        >
            {hideBrowsers ? (
                <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Browsers Hidden</span>
                </>
            ) : (
                <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Show Browsers</span>
                </>
            )}
        </Button>
    );
});
