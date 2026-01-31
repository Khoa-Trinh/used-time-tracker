/**
 * AppIcon Component
 * 
 * Displays an app icon with automatic fallback to initials
 * Uses Google's favicon service for web apps and known desktop apps
 */

'use client';

import { getAppInitials, getAppColor } from '@/lib/favicon';
import { getCachedFaviconUrl } from '@/lib/favicon-cache';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface AppIconProps {
    appName: string;
    platform?: 'web' | 'windows' | 'macos' | 'linux' | 'ios' | 'android';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
};

export function AppIcon({ appName, platform = 'web', size = 'md', className = '' }: AppIconProps) {
    const [imageError, setImageError] = useState(false);
    const [faviconUrl, setFaviconUrl] = useState<string>('');

    useEffect(() => {
        getCachedFaviconUrl(appName, platform).then(setFaviconUrl);
    }, [appName, platform]);

    if (imageError || !faviconUrl) {
        // Fallback to initials
        const initials = getAppInitials(appName);
        const colorClass = getAppColor(appName);

        return (
            <div
                className={`${sizeClasses[size]} ${colorClass} rounded-md flex items-center justify-center font-semibold text-white ${className}`}
                title={appName}
            >
                {initials}
            </div>
        );
    }

    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
    };

    return (
        <Image
            src={faviconUrl}
            alt={appName}
            width={sizeMap[size]}
            height={sizeMap[size]}
            className={`rounded-md object-contain bg-muted/20 ${className}`}
            onError={() => setImageError(true)}
            title={appName}
            unoptimized // External images from Google
        />
    );
}
