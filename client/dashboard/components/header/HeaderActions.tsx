import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { ModeToggle } from '@/components/ModeToggle';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { BrowserToggle } from './BrowserToggle';

const HeaderActions = memo(function HeaderActions() {
    const { refetch, isRefetching: isRefreshing } = useDashboardStats();

    const router = useRouter();
    const isHosted = process.env.NEXT_PUBLIC_AUTH_MODE === 'hosted';

    const handleRefresh = () => {
        refetch();
    };

    const handleLogout = async () => {
        await authClient.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="flex items-center gap-3">
            <BrowserToggle />

            <div className="h-6 w-px bg-border/50 mx-1" /> {/* Separator */}

            <div className="flex items-center gap-2">
                <ModeToggle />

                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="relative h-9 w-9 rounded-xl bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border shadow-sm transition-all duration-200"
                    title="Refresh Data"
                >
                    <div
                        className={isRefreshing ? "animate-spin" : ""}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </div>
                </Button>

                <Link href="/settings">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border shadow-sm transition-all duration-200"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                </Link>

                {isHosted && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLogout}
                        className="h-9 w-9 rounded-xl bg-background hover:bg-red-500/10 text-muted-foreground hover:text-red-500 border-border hover:border-red-500/20 shadow-sm transition-all duration-200"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
});

export default HeaderActions;
