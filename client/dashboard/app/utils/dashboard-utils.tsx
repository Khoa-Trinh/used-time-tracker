import { Monitor, Globe, Smartphone } from 'lucide-react';

export interface StatItem {
    appId: string;
    appName: string;
    totalTimeMs: number;
    category: 'productive' | 'distracting' | 'neutral' | 'uncategorized';
    platforms?: string[];
    timelines: Array<{
        deviceId: string;
        startTime: string;
        endTime: string;
    }>;
}

export interface StatsResponse {
    success: boolean;
    data: {
        hourly: Record<number, StatItem[]>;
        daily: StatItem[];
    };
}

export const IGNORED_APPS = [
    'Google Chrome',
    'Chrome',
    'Microsoft Edge',
    'Msedge',
    'Firefox',
    'Opera',
    'Brave',
    'Arc',
    'Vivaldi'
];

export const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

export const getPlatformIcon = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) return <Monitor className="w-3.5 h-3.5 text-zinc-600" />;

    // If it has web, show globe (browser activity usually)
    if (platforms.includes('web')) return <Globe className="w-3.5 h-3.5 text-blue-400" />;

    // Mobile
    if (platforms.includes('android') || platforms.includes('ios')) return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;

    // Desktop
    return <Monitor className="w-3.5 h-3.5 text-purple-400" />;
};
