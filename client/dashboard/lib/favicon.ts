/**
 * Favicon Utilities for Client-Side Icon Display
 * 
 * Instead of storing favicons in the database, we fetch them dynamically
 * from Google's favicon service using app names.
 */

/**
 * Get the favicon URL for a given app name
 * 
 * @param appName - The name of the app (e.g., "github.com", "Slack", "Visual Studio Code")
 * @param platform - The platform the app is from (default: "web")
 * @returns URL to the favicon from Google's service
 */
export function getFaviconUrl(appName: string, platform: 'web' | 'windows' | 'macos' | 'linux' | 'ios' | 'android' = 'web'): string {
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
        // 'terminal': 'apple.com',
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

/**
 * Get app initials for fallback display when favicon fails to load
 * 
 * @param appName - The name of the app
 * @returns 1-2 letter initials
 */
export function getAppInitials(appName: string): string {
    const words = appName
        .replace(/\.(exe|app|com|io|net|org)$/i, '')
        .split(/[\s\-_\.]+/)
        .filter(w => w.length > 0);

    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();

    return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Get a color for an app based on its name (for fallback avatar backgrounds)
 * 
 * @param appName - The name of the app
 * @returns Tailwind color class
 */
export function getAppColor(appName: string): string {
    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-sky-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
        'bg-rose-500',
    ];

    // Simple hash function to get consistent color for same app
    let hash = 0;
    for (let i = 0; i < appName.length; i++) {
        hash = appName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}
