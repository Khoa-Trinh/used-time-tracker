import { memo } from 'react';
import Link from 'next/link';

export const Header = memo(() => (
    <header className="mb-10">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-zinc-200">Settings</span>
        </div>
        <h1 className="text-3xl font-bold bg-linear-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Settings
        </h1>
    </header>
));
Header.displayName = 'Header';
