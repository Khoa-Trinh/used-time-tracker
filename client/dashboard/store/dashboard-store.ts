import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DashboardState {
    hideBrowsers: boolean;
    selectedHour: number;
    timeZone: string;

    // Actions
    setHideBrowsers: (hide: boolean) => void;
    setSelectedHour: (hour: number) => void;
    setTimeZone: (tz: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            hideBrowsers: true,
            selectedHour: new Date().getHours(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            setHideBrowsers: (hideBrowsers) => set({ hideBrowsers }),
            setSelectedHour: (selectedHour) => set({ selectedHour }),
            setTimeZone: (timeZone) => set({ timeZone }),
        }),
        {
            name: 'dashboard-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                hideBrowsers: state.hideBrowsers,
                selectedHour: state.selectedHour,
                timeZone: state.timeZone,
            }),
        }
    )
);
