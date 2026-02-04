import { memo, useMemo } from 'react';
import { TotalFocusCard } from '../summary/TotalFocusCard';
import { TopAppCard } from '../summary/TopAppCard';
import { ProductivityCard } from '../summary/ProductivityCard';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
} as const;

const SummaryCards = memo(function SummaryCards() {
    const { stats, isPending: loading } = useDashboardStats();
    const dailyStats = stats.daily || [];
    const appsMap = stats.apps || {};

    const { totalTimeMs, topApp, productivityScore, productiveMs, hourlyActivity } = useMemo(() => {
        if (!dailyStats.length) return { totalTimeMs: 0, topApp: null, productivityScore: 0, productiveMs: 0, hourlyActivity: [] };

        const totalTimeMs = dailyStats.reduce((acc, item) => acc + item.totalTimeMs, 0);
        const topApp = dailyStats.reduce((prev, current) => (prev.totalTimeMs > current.totalTimeMs) ? prev : current, dailyStats[0] || null);

        const productiveMs = dailyStats
            .reduce((acc, item) => {
                const appMeta = appsMap[item.appId];
                const category = appMeta ? appMeta.category : item.category;
                return category === 'productive' ? acc + item.totalTimeMs : acc;
            }, 0);

        const productivityScore = totalTimeMs > 0 ? Math.min(100, Math.round((productiveMs / totalTimeMs) * 100)) : 0;

        // Calculate generic hourly distribution for the chart
        const hourlyData = stats.hourly || {};
        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
            const hourStats = hourlyData[hour] || [];
            return {
                hour,
                usage: hourStats.reduce((acc: number, item: any) => acc + item.totalTimeMs, 0)
            };
        });

        return { totalTimeMs, topApp, productivityScore, productiveMs, hourlyActivity };
    }, [dailyStats, stats.hourly, appsMap]);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            <motion.div variants={itemVariants}>
                <TotalFocusCard loading={loading} totalTimeMs={totalTimeMs} hourlyActivity={hourlyActivity} />
            </motion.div>
            <motion.div variants={itemVariants}>
                <TopAppCard loading={loading} topApp={topApp} totalTimeMs={totalTimeMs} />
            </motion.div>
            <motion.div variants={itemVariants}>
                <ProductivityCard loading={loading} productivityScore={productivityScore} productiveMs={productiveMs} />
            </motion.div>
        </motion.div>
    );
});

export default SummaryCards;


