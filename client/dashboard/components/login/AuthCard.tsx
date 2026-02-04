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
import { motion, AnimatePresence } from 'framer-motion';

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
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1], // Custom out-expo-like curve
                scale: {
                    type: "spring",
                    damping: 20,
                    stiffness: 100
                }
            }}
            className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col items-stretch relative"
        >
            {/* More subtle inner ring */}
            <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={isSignUp ? 'signup' : 'signin'}
                    initial={{ opacity: 0, x: isSignUp ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isSignUp ? -10 : 10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <AuthHeader isSignUp={isSignUp} />

                    <AuthForm
                        isSignUp={isSignUp}
                        loading={loading}
                        onSubmit={handleAuth}
                    />
                </motion.div>
            </AnimatePresence>

            <AuthToggle
                isSignUp={isSignUp}
                onToggle={() => setIsSignUp(!isSignUp)}
            />
        </motion.div>
    );
}
