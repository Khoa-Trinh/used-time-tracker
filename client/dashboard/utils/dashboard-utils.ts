export interface StatItem {
    appId: string;
    appName: string;
    totalTimeMs: number;
    category: 'productive' | 'distracting' | 'neutral' | 'uncategorized';
    platforms?: string[];
    autoSuggested?: boolean;
    timelines: Array<{
        deviceId: string;
        startTime: string;
        endTime: string;
    }>;
}

export interface AppMetadata {
    appId: string;
    appName: string;
    category: 'productive' | 'distracting' | 'neutral' | 'uncategorized';
    platforms: string[];
    autoSuggested: boolean;
}

export interface ApiHourlyItem {
    appId: string;
    timelines: Array<{ startTime: string; endTime: string; deviceId: string }>;
}

export interface ApiDailyItem {
    appId: string;
    totalTimeMs: number;
}

export interface ApiStatsResponse {
    success: boolean;
    data: {
        apps: Record<string, AppMetadata>;
        hourly: Record<number, ApiHourlyItem[]>;
        daily: ApiDailyItem[];
    };
}

export interface StatsResponse {
    success: boolean;
    data: {
        apps: Record<string, AppMetadata>;
        hourly: Record<number, StatItem[]>;
        daily: StatItem[];
        _lastFetch?: string;
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

export const CATEGORY_COLORS = {
    productive: '#10b981', // emerald-500
    distracting: '#ef4444', // red-500
    neutral: '#3b82f6',     // blue-500
    uncategorized: '#71717a' // zinc-500
};