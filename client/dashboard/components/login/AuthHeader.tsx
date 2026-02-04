'use client';

import { ShieldCheck } from 'lucide-react';

interface AuthHeaderProps {
    isSignUp: boolean;
}

export function AuthHeader({ isSignUp }: AuthHeaderProps) {
    return (
        <div className="flex flex-col items-center text-center mb-10">
            <div className="mb-6 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                <div className="relative p-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                {isSignUp ? (
                    <span>Create your <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">account</span></span>
                ) : (
                    <span>Welcome <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">back</span></span>
                )}
            </h1>
            <p className="text-zinc-400 text-sm max-w-[280px] leading-relaxed">
                {isSignUp
                    ? 'Join thousands of developers tracking their productivity effortlessly.'
                    : 'Enter your credentials to access your personal dashboard.'}
            </p>
        </div>
    );
}

