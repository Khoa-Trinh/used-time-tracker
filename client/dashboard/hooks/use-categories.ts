'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api-client';
import { toast } from 'sonner';
import { StatItem, StatsResponse } from '@/utils/dashboard-utils';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

export function useCategoryMutations() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const queryKey = ['dashboard-stats', 'today', timeZone];

    const updateCategoryMutation = useMutation({
        mutationFn: async ({ appId, category, autoSuggested }: Pick<StatItem, 'appId' | 'category' | 'autoSuggested'>) => {
            const { error } = await client.api.apps({ id: appId }).category.patch({
                category,
                autoSuggested
            });

            if (error) {
                if (error.status === 401) {
                    await authClient.signOut();
                    router.push('/login');
                }
                throw error;
            }
            return { appId, category, autoSuggested };
        },
        onMutate: async ({ appId, category, autoSuggested }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousStats = queryClient.getQueryData<StatsResponse['data']>(queryKey);

            if (previousStats && previousStats.apps) {
                const newApps = {
                    ...previousStats.apps,
                    [appId]: {
                        ...(previousStats.apps[appId] || {}),
                        category,
                        autoSuggested
                    }
                };

                queryClient.setQueryData(queryKey, {
                    ...previousStats,
                    apps: newApps,
                });
            }

            return { previousStats };
        },
        onError: (err, variables, context) => {
            console.error('Failed to update category:', err);
            toast.error('Failed to update category');
            if (context?.previousStats) {
                queryClient.setQueryData(queryKey, context.previousStats);
            }
        },
        onSettled: () => {
            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const suggestCategoryMutation = useMutation({
        mutationFn: async ({ appId, appName }: Pick<StatItem, 'appId' | 'appName'>) => {
            const { data, error } = await client.api.apps.suggest.post({ appName });

            if (error) {
                if (error.status === 401) {
                    await authClient.signOut();
                    router.push('/login');
                }
                throw error;
            }

            if (!data?.success || !data.data?.category) {
                throw new Error('No suggestion returned');
            }

            return { appId, category: data.data.category as StatItem['category'] };
        },
        onMutate: () => {
            toast.loading('Asking AI for suggestion...', { id: 'ai-suggest' });
        },
        onError: (err) => {
            console.error('AI Suggestion failed:', err);
        }
    });

    return {
        updateCategory: updateCategoryMutation.mutate,
        suggestCategory: suggestCategoryMutation.mutateAsync,
        isUpdating: updateCategoryMutation.isPending,
        isSuggesting: suggestCategoryMutation.isPending
    };
}

export const useAppCategory = (appId: string, initialCategory: StatItem['category'], initialAutoSuggested?: boolean): Pick<StatItem, 'category' | 'autoSuggested'> => {
    const { stats } = useDashboardStats();

    if (stats?.apps && stats.apps[appId]) {
        return {
            category: stats.apps[appId].category,
            autoSuggested: stats.apps[appId].autoSuggested
        };
    }

    return {
        category: initialCategory,
        autoSuggested: initialAutoSuggested
    };
};
