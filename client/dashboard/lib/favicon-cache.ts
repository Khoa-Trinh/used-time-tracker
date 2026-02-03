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
        // console.log(`[Favicon] In-memory cache hit: ${appName}`);
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

            if (response) {
                // console.log(`[Favicon] Browser cache hit: ${appName}`);
            } else {
                // console.log(`[Favicon] Network fetch: ${appName}`);
                // Not in cache, fetch and cache it
                // Fire and forget - completely ignore errors to prevent console noise
                fetch(url, {
                    mode: 'no-cors',
                    cache: 'force-cache'
                }).then(res => {
                    if (res.ok || res.type === 'opaque') {
                        cache.put(url, res.clone());
                    }
                }).catch(() => {
                    // Sshh... it's okay. No favicon? No problem.
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
            // console.warn('Failed to clear favicon cache:', e);
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
            // Use DuckDuckGo icons API - more reliable than Google
            return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
        } catch {
            // If parsing fails, use as-is
            return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(appName)}.ico`;
        }
    }

    // For desktop apps, try to match known apps to their web equivalents
    const appMappings: Record<string, string> = {
        // Development
        'visual studio code': 'code.visualstudio.com',
        'vscode': 'code.visualstudio.com',
        'vs code': 'code.visualstudio.com',
        'pycharm': 'jetbrains.com',
        'intellij idea': 'jetbrains.com',
        'webstorm': 'jetbrains.com',
        'android studio': 'developer.android.com',
        'antigravity': 'google.com', // Gemini/AI assistant

        // Communication
        'slack': 'slack.com',
        'discord': 'discord.com',
        'microsoft teams': 'teams.microsoft.com',
        'teams': 'teams.microsoft.com',
        'zoom': 'zoom.us',
        'skype': 'skype.com',

        // Productivity
        'notion': 'notion.so',
        'obsidian': 'obsidian.md',
        'evernote': 'evernote.com',
        'todoist': 'todoist.com',
        'trello': 'trello.com',

        // Browsers
        'google chrome': 'google.com',
        'chrome': 'google.com',
        'firefox': 'mozilla.org',
        'microsoft edge': 'microsoft.com',
        'edge': 'microsoft.com',
        'brave': 'brave.com',
        'opera': 'opera.com',
        'safari': 'apple.com',
        'arc': 'arc.net',
        'vivaldi': 'vivaldi.com',

        // Entertainment
        'spotify': 'spotify.com',
        'steam': 'steampowered.com',
        'epic games': 'epicgames.com',

        // Windows System Apps
        'explorer': 'microsoft.com',
        'windows explorer': 'microsoft.com',
        'notepad': 'microsoft.com',
        'powershell': 'microsoft.com',
        'cmd': 'microsoft.com',
        'terminal': 'microsoft.com',

        // macOS System Apps
        'finder': 'apple.com',
    };

    const normalizedName = appName.toLowerCase();
    const domain = appMappings[normalizedName];

    if (domain) {
        return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
    }

    // Fallback: try using the app name as domain
    // Remove ".exe" and other extensions
    const cleanName = appName.replace(/\.(exe|app)$/i, '').toLowerCase();
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(cleanName)}.com.ico`;
}
