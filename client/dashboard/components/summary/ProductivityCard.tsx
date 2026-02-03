import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { formatTime } from '../../utils/dashboard-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RadialProgress } from '../RadialProgress';

interface ProductivityCardProps {
    loading?: boolean;
    productivityScore: number;
    productiveMs: number;
}

export const ProductivityCard = memo(function ProductivityCard({ loading, productivityScore, productiveMs }: ProductivityCardProps) {
    if (loading) {
        return (
            <Card className="bg-card h-48 flex flex-col justify-between border-border/60 shadow-sm relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32 bg-muted" />
                        <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="space-y-1 mb-1">
                            <Skeleton className="h-9 w-24 bg-muted mb-1" />
                            <Skeleton className="h-3 w-28 bg-muted" />
                        </div>

                        <div className="-mb-1 -mr-2">
                            <Skeleton className="h-[70px] w-[70px] rounded-full bg-muted/20 border-6 border-muted" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card h-48 flex flex-col justify-between border-border/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-emerald-500/20">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardContent className="p-5 flex flex-col h-full justify-between relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground tracking-wide">Productivity Score</span>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                        <Activity className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="space-y-1 mb-1">
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-bold text-foreground tracking-tight">{productivityScore}</h3>
                            <span className="text-xs text-muted-foreground font-medium">/100</span>
                        </div>
                        <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {formatTime(productiveMs)} Productive
                        </p>
                    </div>

                    <div className="relative -mb-1 -mr-2">
                        <RadialProgress score={productivityScore} size={70} strokeWidth={6} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
