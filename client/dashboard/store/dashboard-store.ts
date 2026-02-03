import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DashboardState {
    hideBrowsers: boolean;
    selectedHour: number;

    // Actions
    setHideBrowsers: (hide: boolean) => void;
    setSelectedHour: (hour: number) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            hideBrowsers: true,
            selectedHour: new Date().getHours(),

            setHideBrowsers: (hideBrowsers) => set({ hideBrowsers }),
            setSelectedHour: (selectedHour) => set({ selectedHour }),
        }),
        {
            name: 'dashboard-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                hideBrowsers: state.hideBrowsers,
                selectedHour: state.selectedHour,
            }),
        }
    )
);
