/**
 * Favicon Cache Manager
 * 
 * Implements multi-layer caching strategy:
 * 1. In-memory cache (fastest)
 * 2. Browser cache (via Cache API)
 * 3. Google's CDN (with HTTP cache headers)
 */

// In-memory cache for quick lookups
const faviconCache = new Map<string, string>();

// Cache duration: 7 days
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Cache key generator
 */
function getCacheKey(appName: string, platform: string): string {
    return `favicon:${platform}:${appName.toLowerCase()}`;
}

/**
 * Get favicon URL with caching
 */
export async function getCachedFaviconUrl(
    appName: string,
    platform: 'web' | 'windows' | 'macos' | 'linux' | 'ios' | 'android' = 'web'
): Promise<string> {
    const cacheKey = getCacheKey(appName, platform);

    // Check in-memory cache first
    if (faviconCache.has(cacheKey)) {
        return faviconCache.get(cacheKey)!;
    }

    // Generate URL
    const url = getFaviconUrl(appName, platform);

    // Store in in-memory cache
    faviconCache.set(cacheKey, url);

    // Prefetch the image to populate browser cache
    if (typeof window !== 'undefined' && 'caches' in window) {
        try {
            const cache = await caches.open('favicon-cache-v1');
            const response = await cache.match(url);

            if (!response) {
                // Not in cache, fetch and cache it
                fetch(url, {
                    mode: 'no-cors',
                    cache: 'force-cache' // Use browser HTTP cache
                }).then(res => {
                    if (res.ok || res.type === 'opaque') {
                        cache.put(url, res.clone());
                    }
                }).catch(() => {
                    // Silently fail - fallback to direct fetch
                });
            }
        } catch (e) {
            // Cache API not available or failed, continue without caching
        }
    }

    return url;
}

/**
 * Preload favicons for multiple apps
 */
export function preloadFavicons(
    apps: Array<{ appName: string; platform?: string }>
): void {
    if (typeof window === 'undefined') return;

    apps.forEach(({ appName, platform = 'web' }) => {
        const url = getFaviconUrl(appName, platform as any);
        const cacheKey = getCacheKey(appName, platform);

        // Add to in-memory cache
        faviconCache.set(cacheKey, url);

        // Prefetch images
        const img = new Image();
        img.src = url;
    });
}

/**
 * Clear favicon cache (e.g., after app updates)
 */
export async function clearFaviconCache(): Promise<void> {
    // Clear in-memory cache
    faviconCache.clear();

    // Clear browser cache
    if (typeof window !== 'undefined' && 'caches' in window) {
        try {
            await caches.delete('favicon-cache-v1');
        } catch (e) {
            console.warn('Failed to clear favicon cache:', e);
        }
    }
}

/**
 * Get favicon cache stats
 */
export function getFaviconCacheStats() {
    return {
        inMemoryCount: faviconCache.size,
        entries: Array.from(faviconCache.keys())
    };
}

/**
 * Original favicon URL generator (from favicon.ts)
 */
function getFaviconUrl(appName: string, platform: 'web' | 'windows' | 'macos' | 'linux' | 'ios' | 'android' = 'web'): string {
    // For browser URLs, use the domain directly
    if (platform === 'web') {
        // Extract domain if it's a full URL
        try {
            const domain = new URL(appName.startsWith('http') ? appName : `https://${appName}`).hostname;
            return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
        } catch {
            // If parsing fails, use as-is
            return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(appName)}&sz=64`;
        }
    }

    // For desktop apps, try to match known apps to their web equivalents
    const appMappings: Record<string, string> = {
        // Development
        'visual studio code': 'code.visualstudio.com',
        'vscode': 'code.visualstudio.com',
        'vs code': 'code.visualstudio.com',
        'pycharm': 'jetbrains.com/pycharm',
        'intellij idea': 'jetbrains.com/idea',
        'webstorm': 'jetbrains.com/webstorm',
        'android studio': 'developer.android.com',

        // Communication
        'slack': 'slack.com',
        'discord': 'discord.com',
        'microsoft teams': 'teams.microsoft.com',
        'zoom': 'zoom.us',
        'skype': 'skype.com',

        // Productivity
        'notion': 'notion.so',
        'obsidian': 'obsidian.md',
        'evernote': 'evernote.com',
        'todoist': 'todoist.com',
        'trello': 'trello.com',

        // Browsers
        'google chrome': 'google.com/chrome',
        'chrome': 'google.com/chrome',
        'firefox': 'mozilla.org/firefox',
        'microsoft edge': 'microsoft.com/edge',
        'edge': 'microsoft.com/edge',
        'brave': 'brave.com',
        'opera': 'opera.com',
        'safari': 'apple.com/safari',
        'arc': 'arc.net',

        // Entertainment
        'spotify': 'spotify.com',
        'steam': 'steampowered.com',
        'epic games': 'epicgames.com',

        // Windows System Apps
        'explorer': 'microsoft.com/windows',
        'notepad': 'microsoft.com/windows',
        'powershell': 'microsoft.com/powershell',
        'cmd': 'microsoft.com/windows',
        'terminal': 'microsoft.com/windows',

        // macOS System Apps
        'finder': 'apple.com',
    };

    const normalizedName = appName.toLowerCase();
    const domain = appMappings[normalizedName];

    if (domain) {
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    }

    // Fallback: try using the app name as domain
    // Remove ".exe" and other extensions
    const cleanName = appName.replace(/\.(exe|app)$/i, '').toLowerCase();
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanName)}.com&sz=64`;
}
