'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#09090b] font-sans text-foreground relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background Image with blur-in effect */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/auth-bg.png"
                    alt="Space Illustration"
                    fill
                    className="object-cover opacity-30 mix-blend-luminosity grayscale"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-b from-[#09090b] via-transparent to-[#09090b] opacity-90" />
            </div>

            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />

            <div className="relative z-10 w-full max-w-md text-center space-y-8">
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                        <div className="relative p-6 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl">
                            <Ghost className="w-12 h-12 text-indigo-400 animate-bounce" />
                        </div>
                    </div>

                    <h1 className="text-8xl font-black tracking-tighter text-white">404</h1>
                    <h2 className="text-2xl font-bold text-zinc-200 mt-2">Lost in the <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">void</span></h2>
                    <p className="text-zinc-500 mt-4 max-w-[320px] mx-auto leading-relaxed">
                        The page you are looking for has drifted beyond our tracking range. It may have been relocated or deleted.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/" className="group relative w-full sm:w-auto px-8 py-3 bg-indigo-600 rounded-xl text-sm font-semibold text-white transition-all hover:bg-indigo-500 flex items-center justify-center gap-2 overflow-hidden shadow-lg shadow-indigo-500/20">
                        <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Home className="relative w-4 h-4" />
                        <span className="relative">Back to Base</span>
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                <div className="pt-8 opacity-40">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-medium">
                        System Status: <span className="text-zinc-400">Page Not Found</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
