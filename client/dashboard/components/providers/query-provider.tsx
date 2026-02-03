'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { useState } from 'react';

// Use localStorage with async adapter as recommended
export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute stale
                gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection
            },
        },
    }));

    const [persister] = useState(() => {
        if (typeof window !== 'undefined') {
            return createAsyncStoragePersister({
                storage: window.localStorage,
            });
        }
        return undefined;
    });

    if (!persister) {
        // Fallback for SSR/Server Components
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}
