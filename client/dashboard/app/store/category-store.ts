import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

interface CategoryState {
    categoryMap: Record<string, { category: string; autoSuggested?: boolean }>;

    // Actions
    setCategoryMap: (map: Record<string, { category: string; autoSuggested?: boolean }>) => void;
    updateCategory: (appId: string, category: string, previousCategory: string, autoSuggested?: boolean) => void;
    suggestAppCategory: (appId: string, appName: string, currentCategory: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>()(
    persist(
        (set, get) => ({
            categoryMap: {},

            setCategoryMap: (categoryMap) => set({ categoryMap }),

            updateCategory: (appId, category, previousCategory, autoSuggested = false) => {
                const state = get();

                // 1. Optimistic Update
                set(state => ({
                    categoryMap: {
                        ...state.categoryMap,
                        [appId]: { category, autoSuggested }
                    }
                }));

                // 2. Fire-and-forget background API sync
                queueMicrotask(async () => {
                    try {
                        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
                        const res = await fetch(`${baseUrl}/api/apps/${appId}/category`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category: category, autoSuggested: autoSuggested }),
                            credentials: 'include'
                        });

                        if (!res.ok) {
                            throw new Error(`Failed to update category: ${res.status}`);
                        }
                    } catch (err) {
                        console.error('Failed to update category:', err);
                        // Revert on failure
                        set(state => ({
                            categoryMap: {
                                ...state.categoryMap,
                                [appId]: { category: previousCategory, autoSuggested: state.categoryMap[appId]?.autoSuggested }
                            }
                        }));
                        toast.error('Failed to update category. Please try again.');
                    }
                });
            },

            suggestAppCategory: async (appId: string, appName: string, currentCategory: string) => {
                const { updateCategory } = get();
                const toastId = toast.loading('Asking AI for suggestion...');

                try {
                    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
                    const res = await fetch(`${baseUrl}/api/apps/suggest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ appName }),
                        credentials: 'include'
                    });

                    if (!res.ok) throw new Error('Failed to get suggestion');

                    const data = await res.json();
                    if (data.success && data.data?.category) {
                        toast.success(`AI Suggested: ${data.data.category}`, { id: toastId });
                        // Pass true for autoSuggested
                        updateCategory(appId, data.data.category, currentCategory, true);
                    } else {
                        throw new Error('No suggestion returned');
                    }
                } catch (err) {
                    console.error('AI Suggestion failed:', err);
                    toast.error('Failed to get AI suggestion', { id: toastId });
                }
            }
        }),
        {
            name: 'category-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                categoryMap: state.categoryMap,
            }),
        }
    )
);

export const useAppCategory = (appId: string, initialCategory: string, initialAutoSuggested?: boolean) => {
    const categoryInfo = useCategoryStore(state => state.categoryMap[appId]);

    if (categoryInfo) {
        return {
            category: categoryInfo.category,
            autoSuggested: categoryInfo.autoSuggested
        };
    }

    return {
        category: initialCategory,
        autoSuggested: initialAutoSuggested
    };
};
