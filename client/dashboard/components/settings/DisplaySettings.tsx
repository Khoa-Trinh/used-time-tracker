import { memo } from 'react';
import { useDashboardStore } from '../../store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';
import { EyeOff, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const DisplaySettings = memo(function DisplaySettings() {
    const { hideBrowsers, setHideBrowsers } = useDashboardStore(useShallow(state => ({
        hideBrowsers: state.hideBrowsers,
        setHideBrowsers: state.setHideBrowsers
    })));

    return (
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-zinc-800/50 rounded-lg text-zinc-400">
                        {hideBrowsers ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-medium text-zinc-200 text-sm">Hide Browser Activity</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Filter out generic browser process names (chrome.exe, msedge.exe) from the timeline, keeping only specific websites if captured.
                        </p>
                    </div>
                </div>

                <Switch
                    checked={hideBrowsers}
                    onCheckedChange={setHideBrowsers}
                />
            </div>
        </div>
    );
});
