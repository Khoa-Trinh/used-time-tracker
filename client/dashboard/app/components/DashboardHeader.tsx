import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { useDashboardStore } from '../store/dashboard-store';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useShallow } from 'zustand/react/shallow';

const DashboardHeader = memo(function DashboardHeader() {
    // optimize selectors to avoid re-renders on unrelated data changes
    const { refreshing, hideBrowsers } = useDashboardStore(useShallow(state => ({
        refreshing: state.refreshing,
        hideBrowsers: state.hideBrowsers
    })));

    // Actions are stable, but good to separate or just pick them
    const { setRefreshing, fetchStats, setHideBrowsers } = useDashboardStore(useShallow(state => ({
        setRefreshing: state.setRefreshing,
        fetchStats: state.fetchStats,
        setHideBrowsers: state.setHideBrowsers
    })));

    const router = useRouter();
    const isHosted = process.env.NEXT_PUBLIC_AUTH_MODE === 'hosted';

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleLogout = async () => {
        await authClient.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <header className="flex items-center justify-between pb-6 border-b border-border">
            <div>
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
                >
                    Time Tracker
                </motion.h1>
                <p className="text-muted-foreground mt-2 text-sm tracking-wide uppercase font-medium">Daily Overview</p>
            </div>

            <div className="flex items-center gap-4">
                <ModeToggle />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="relative w-10 h-10 rounded-xl bg-background hover:bg-accent border border-border hover:border-zinc-500 dark:hover:border-zinc-700 transition-colors"
                    title="Refresh Data"
                >
                    <motion.div
                        animate={refreshing ? { rotate: 360 } : {}}
                        transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}
                    >
                        <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </motion.div>
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => setHideBrowsers(!hideBrowsers)}
                    className={`h-10 px-4 rounded-xl text-xs font-medium transition-colors border ${hideBrowsers
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                        : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                        }`}
                >
                    {hideBrowsers ? 'Browsers Hidden' : 'Show Browsers'}
                </Button>

                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl bg-background hover:bg-accent border border-border hover:border-zinc-500 dark:hover:border-zinc-700 transition-colors group"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                    </Button>
                </Link>

                {isHosted && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-xl bg-background hover:bg-accent border border-border hover:border-zinc-500 dark:hover:border-zinc-700 transition-colors group"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-red-400" />
                    </Button>
                )}
            </div>
        </header>
    );
});

export default DashboardHeader;
