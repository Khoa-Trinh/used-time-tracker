'use client';

import { ModeToggle } from '@/components/header/ModeToggle';
import { Terminal, Cpu, Zap } from 'lucide-react';
import Image from 'next/image';
import { AuthCard } from '@/components/login/AuthCard';

export default function LoginClient() {
    return (
        <div className="min-h-screen bg-[#09090b] font-sans text-foreground relative flex overflow-hidden">
            {/* Left Side: Illustration - Visible on medium screens and up */}
            <div className="hidden md:flex flex-1 relative bg-zinc-950 items-center justify-center p-8 lg:p-12 overflow-hidden border-r border-white/5">
                {/* Background Image with blur-in effect */}
                <Image
                    src="/auth-bg.png"
                    alt="Productivity Illustration"
                    fill
                    className="object-cover opacity-60 mix-blend-luminosity animate-in fade-in zoom-in-105 duration-1000"
                    priority
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-linear-to-r from-[#09090b]/20 to-transparent" />

                {/* Content Overlay */}
                <div className="relative z-10 w-full max-w-lg space-y-8 lg:space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                            < Zap className="w-3 h-3" />
                            <span>v2.0 Beta out now</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-white">
                            Track your <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">digital heartbeat</span> in real-time.
                        </h2>
                        <p className="text-zinc-400 text-base lg:text-lg leading-relaxed">
                            A minimalist approach to deep-focus tracking. Built for developers who value their time.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                        <div className="p-4 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 space-y-2">
                            <Terminal className="w-5 h-5 text-indigo-400" />
                            <p className="text-xs font-bold text-zinc-500 uppercase">Automated</p>
                            <p className="text-sm text-zinc-300">Background tracking with zero configuration.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 space-y-2">
                            <Cpu className="w-5 h-5 text-purple-400" />
                            <p className="text-xs font-bold text-zinc-500 uppercase">Private</p>
                            <p className="text-sm text-zinc-300">All data stays in your control. No cloud snooping.</p>
                        </div>
                    </div>
                </div>

                {/* Background Decorative Blob */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 blur-[160px] rounded-full" />
            </div>

            {/* Right Side: Auth Form Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
                <div className="absolute top-6 right-6">
                    <ModeToggle />
                </div>

                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-right-4 duration-700">
                    {/* Visual accent for the form card */}
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />

                    <AuthCard />

                    <div className="mt-8 text-center opacity-60">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">
                            Trusted by developers at global scale
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
