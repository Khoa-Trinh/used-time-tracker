'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Loader2, User, ArrowRight } from 'lucide-react';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { authSchema, type AuthFormValues } from '../../utils/schema';

interface AuthFormProps {
    isSignUp: boolean;
    loading: boolean;
    onSubmit: (data: AuthFormValues) => void;
}

export function AuthForm({ isSignUp, loading, onSubmit }: AuthFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: '',
            password: '',
            name: '',
        },
        mode: 'onChange',
    });

    const inputClasses = "w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 focus:bg-zinc-900/80 outline-none transition-all duration-200";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {isSignUp && (
                <Field>
                    <FieldLabel htmlFor="name" className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">Full Name</FieldLabel>
                    <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            id="name"
                            {...register('name')}
                            placeholder="John Doe"
                            className={inputClasses}
                        />
                    </div>
                    <FieldError errors={[errors.name]} />
                </Field>
            )}

            <Field>
                <FieldLabel htmlFor="email" className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-1">Email Address</FieldLabel>
                <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="you@example.com"
                        className={inputClasses}
                    />
                </div>
                <FieldError errors={[errors.email]} />
            </Field>

            <Field>
                <div className="flex items-center justify-between mb-1 px-1">
                    <FieldLabel htmlFor="password" className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Password</FieldLabel>
                    {!isSignUp && (
                        <button type="button" className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                            Forgot password?
                        </button>
                    )}
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        id="password"
                        type="password"
                        {...register('password')}
                        placeholder="••••••••"
                        className={inputClasses}
                    />
                </div>
                <FieldError errors={[errors.password]} />
            </Field>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={!isValid || loading || isSubmitting}
                    className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative flex items-center justify-center gap-2">
                        {loading || isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span>{isSignUp ? 'Create account' : 'Sign in to dashboard'}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </div>
                </button>
            </div>
        </form>
    );
}

