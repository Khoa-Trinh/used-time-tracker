import { memo, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboard-store';
import { useShallow } from 'zustand/react/shallow';
import { EyeOff, Eye, Globe, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const DisplaySettings = memo(function DisplaySettings() {
    const { hideBrowsers, setHideBrowsers, timeZone, setTimeZone } = useDashboardStore(useShallow(state => ({
        hideBrowsers: state.hideBrowsers,
        setHideBrowsers: state.setHideBrowsers,
        timeZone: state.timeZone,
        setTimeZone: state.setTimeZone
    })));

    const timeZones = useMemo(() => {
        try {
            return (Intl as any).supportedValuesOf('timeZone') as string[];
        } catch (e) {
            return ['UTC', timeZone]; // Fallback
        }
    }, [timeZone]);

    const handleResetTimezone = () => {
        setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    };

    return (
        <div className="space-y-4">
            {/* Browser Visibility */}
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

            {/* Timezone Selection */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all duration-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-zinc-800/50 rounded-lg text-zinc-400">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-zinc-200 text-sm">Display Timezone</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Your data will be displayed and grouped according to this timezone.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResetTimezone}
                            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
                            title="Reset to local timezone"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <Select value={timeZone} onValueChange={(val) => val && setTimeZone(val)}>
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeZones.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
});
