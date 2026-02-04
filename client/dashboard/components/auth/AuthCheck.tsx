'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

export function AuthCheck() {
    const router = useRouter();
    const { isError, error } = useDashboardStats();

    interface ApiError extends Error {
        status?: number;
    }

    function isApiError(err: unknown): err is ApiError {
        return typeof err === 'object' && err !== null && 'status' in err;
    }

    useEffect(() => {
        if (isError && isApiError(error) && error.status === 401) {
            authClient.signOut();
            router.push('/login');
        }
    }, [isError, error, router]);

    return null;
}
