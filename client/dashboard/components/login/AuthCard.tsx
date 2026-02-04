'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { AuthToggle } from './AuthToggle';
import { AuthFormValues } from '@/utils/schema';
import { useQueryClient } from '@tanstack/react-query';

export function AuthCard() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleAuth = async (data: AuthFormValues) => {
        setLoading(true);
        setAuthError(null);

        try {
            if (isSignUp) {
                await authClient.signUp.email({
                    email: data.email,
                    password: data.password,
                    name: data.name || '',
                }, {
                    onSuccess: () => {
                        queryClient.clear();
                        router.push('/');
                        router.refresh();
                    },
                    onError: (ctx) => {
                        setAuthError(ctx.error.message);
                        setLoading(false);
                    }
                });
            } else {
                await authClient.signIn.email({
                    email: data.email,
                    password: data.password,
                }, {
                    onSuccess: () => {
                        queryClient.clear();
                        router.push('/');
                        router.refresh();
                    },
                    onError: (ctx) => {
                        setAuthError(ctx.error.message);
                        setLoading(false);
                    }
                });
            }
        } catch (err) {
            setAuthError('An unexpected error occurred');
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

            {authError && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3 mt-5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{authError}</p>
                </div>
            )}

            <AuthToggle
                isSignUp={isSignUp}
                onToggle={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError(null);
                }}
            />
        </div>
    );
}
