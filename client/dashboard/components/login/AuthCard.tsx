'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { AuthToggle } from './AuthToggle';
import { AuthFormValues } from '@/utils/schema';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function AuthCard() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleAuth = async (data: AuthFormValues) => {
        setLoading(true);

        try {
            if (isSignUp) {
                await authClient.signUp.email({
                    email: data.email,
                    password: data.password,
                    name: data.name || '',
                }, {
                    onSuccess: () => {
                        toast.success('Account created! Welcome to Tick.');
                        queryClient.clear();
                        router.push('/');
                        router.refresh();
                    },
                    onError: (ctx) => {
                        const status = (ctx.error as any)?.status ? ` [${(ctx.error as any).status}]` : '';
                        toast.error(`${ctx.error.message || 'Failed to sign up'}${status}`);
                        setLoading(false);
                    }
                });
            } else {
                await authClient.signIn.email({
                    email: data.email,
                    password: data.password,
                }, {
                    onSuccess: () => {
                        toast.success('Logged in successfully');
                        queryClient.clear();
                        router.push('/');
                        router.refresh();
                    },
                    onError: (ctx) => {
                        const status = (ctx.error as any)?.status ? ` [${(ctx.error as any).status}]` : '';
                        toast.error(`${ctx.error.message || 'Invalid credentials'}${status}`);
                        setLoading(false);
                    }
                });
            }
        } catch (err: any) {
            const status = err?.status ? ` [${err.status}]` : '';
            toast.error(`An unexpected error occurred${status}`);
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col items-stretch relative">
            {/* More subtle inner ring */}
            <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none" />

            <AuthHeader isSignUp={isSignUp} />

            <AuthForm
                isSignUp={isSignUp}
                loading={loading}
                onSubmit={handleAuth}
            />

            <AuthToggle
                isSignUp={isSignUp}
                onToggle={() => {
                    setIsSignUp(!isSignUp);
                }}
            />
        </div>
    );
}
