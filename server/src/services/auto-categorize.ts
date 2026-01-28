// Auto-categorization service - no imports needed for this utility

// Auto-categorization rules based on app name or URL
export function suggestCategory(appName: string, url?: string, userId?: string): {
    suggestedCategory: 'productive' | 'distracting' | 'neutral' | 'uncategorized';
    confidence: number;
} {
    const name = appName.toLowerCase();
    const urlLower = url?.toLowerCase() || '';

    // Development & Productivity Tools (High confidence)
    const productiveApps = [
        'visual studio code', 'vscode', 'code', 'vim', 'neovim', 'sublime',
        'intellij', 'pycharm', 'webstorm', 'android studio',
        'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
        'chat.openai.com', 'claude.ai', 'gemini.google.com',
        'notion.so', 'obsidian', 'evernote', 'onenote',
        'slack', 'discord', 'teams', 'zoom', 'meet.google.com',
        'gmail', 'outlook', 'mail.google.com',
        'figma.com', 'canva.com', 'sketch',
        'docs.google.com', 'office.com', 'excel', 'word', 'powerpoint',
        'trello.com', 'asana.com', 'jira', 'linear.app',
        'terminal', 'cmd', 'powershell', 'iterm', 'warp',
    ];

    // Social Media & Entertainment (High confidence)
    const distractingApps = [
        'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
        'reddit.com', 'pinterest.com', 'snapchat',
        'youtube.com', 'netflix.com', 'hulu.com', 'twitch.tv', 'spotify.com',
        'steam', 'epic games', 'battle.net', 'league of legends', 'valorant',
        'whatsapp', 'telegram', 'wechat', 'line',
    ];

    // Neutral apps (browsers, system tools)
    const neutralApps = [
        'chrome', 'firefox', 'safari', 'edge', 'brave', 'arc', 'vivaldi', 'opera', 'msedge',
        'explorer', 'finder', 'file explorer',
        'settings', 'preferences', 'system preferences',
    ];

    // Check productive patterns
    for (const pattern of productiveApps) {
        if (name.includes(pattern) || urlLower.includes(pattern)) {
            return { suggestedCategory: 'productive', confidence: 0.9 };
        }
    }

    // Check distracting patterns
    for (const pattern of distractingApps) {
        if (name.includes(pattern) || urlLower.includes(pattern)) {
            return { suggestedCategory: 'distracting', confidence: 0.9 };
        }
    }

    // Check neutral patterns
    for (const pattern of neutralApps) {
        if (name.includes(pattern) || urlLower.includes(pattern)) {
            return { suggestedCategory: 'neutral', confidence: 0.8 };
        }
    }

    // Domain-based heuristics for URLs
    if (url) {
        try {
            const domain = new URL(url).hostname;

            // Educational domains
            if (domain.includes('edu') || domain.includes('coursera') ||
                domain.includes('udemy') || domain.includes('edx')) {
                return { suggestedCategory: 'productive', confidence: 0.7 };
            }

            // News sites - neutral
            if (domain.includes('news') || domain.includes('bbc.co') || domain.includes('cnn.com')) {
                return { suggestedCategory: 'neutral', confidence: 0.6 };
            }
        } catch (e) {
            // Invalid URL, skip
        }
    }

    // Default: uncategorized with low confidence
    return { suggestedCategory: 'uncategorized', confidence: 0.0 };
}

// URL pattern matching for user-defined rules
export function matchUrlPattern(url: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    // Escape special regex characters except *
    const escapeRegex = (str: string) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    // Split by * to preserve wildcards
    const parts = pattern.split('*').map(escapeRegex);
    const regexPattern = '^' + parts.join('.*') + '$';

    try {
        const regex = new RegExp(regexPattern, 'i'); // case insensitive
        return regex.test(url);
    } catch (e) {
        console.error('Invalid pattern:', pattern, e);
        return false;
    }
}
