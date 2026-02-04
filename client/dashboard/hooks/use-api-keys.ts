import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface ApiKey {
    id: string;
    label: string | null;
    key?: string;
    createdAt: Date;
    lastUsedAt: Date | null;
}

export function useApiKeys() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const keysQuery = useQuery({
        queryKey: ['api-keys'],
        queryFn: async () => {
            const { data, error } = await client.api.keys.get();

            if (error) {
                if (error.status === 401) {
                    await authClient.signOut();
                    router.push('/login');
                }
                throw error;
            }

            if (!data.success) throw new Error('Failed to fetch keys');
            return data.data as ApiKey[];
        }
    });

    const createKeyMutation = useMutation({
        mutationFn: async (label: string) => {
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const finalLabel = label.trim() || `key_${randomSuffix}`;

            const { data, error } = await client.api.keys.post({
                label: finalLabel
            });

            if (error) {
                if (error.status === 401) {
                    await authClient.signOut();
                    router.push('/login');
                }
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            toast.success('API Key created successfully');
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        },
        onError: (error: any) => {
            const status = error?.status ? ` [${error.status}]` : '';
            console.error('Failed to create API key:', error);
            toast.error(`Failed to create API key${status}`);
        }
    });

    const deleteKeyMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await client.api.keys({ id }).delete();

            if (error) {
                if (error.status === 401) {
                    await authClient.signOut();
                    router.push('/login');
                }
                throw error;
            }
            return true;
        },
        onSuccess: () => {
            toast.success('API Key revoked');
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        },
        onError: (error: any) => {
            const status = error?.status ? ` [${error.status}]` : '';
            console.error('Failed to revoke API key:', error);
            toast.error(`Failed to revoke API key${status}`);
        }
    });

    return {
        keys: keysQuery.data || [],
        isLoading: keysQuery.isLoading,
        createKey: createKeyMutation.mutate,
        isCreating: createKeyMutation.isPending,
        deleteKey: deleteKeyMutation.mutate,
        isDeleting: deleteKeyMutation.isPending,
        creationResult: createKeyMutation.data
    };
}
