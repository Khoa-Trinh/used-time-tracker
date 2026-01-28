// Favicon fetching service with multiple fallbacks

export async function fetchFavicon(url: string, providedIconUrl?: string): Promise<string | null> {
    // If browser extension already provided the favicon, use it
    if (providedIconUrl && providedIconUrl.startsWith('data:')) {
        // Data URI - can store directly
        return providedIconUrl;
    }

    if (providedIconUrl && providedIconUrl.startsWith('http')) {
        // Try to fetch and convert to data URI for caching
        try {
            const response = await fetch(providedIconUrl, {
                signal: AbortSignal.timeout(3000), // 3s timeout
            });

            if (response.ok) {
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                const mimeType = response.headers.get('content-type') || 'image/png';
                return `data:${mimeType};base64,${base64}`;
            }
        } catch (e) {
            console.warn('Failed to fetch provided icon URL:', providedIconUrl, e);
        }
    }

    // Extract domain from URL
    let domain: string;
    try {
        domain = new URL(url).hostname;
    } catch (e) {
        console.warn('Invalid URL for favicon fetch:', url);
        return null;
    }

    // Fallback 1: Google favicon service
    try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        const response = await fetch(googleUrl, {
            signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            return `data:image/png;base64,${base64}`;
        }
    } catch (e) {
        console.warn('Google favicon service failed for', domain);
    }

    // Fallback 2: DuckDuckGo favicon service
    try {
        const duckduckgoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        const response = await fetch(duckduckgoUrl, {
            signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            return `data:image/x-icon;base64,${base64}`;
        }
    } catch (e) {
        console.warn('DuckDuckGo favicon service failed for', domain);
    }

    // All fallbacks failed
    return null;
}

// Get first letter for fallback display
export function getAppInitial(appName: string): string {
    return appName.charAt(0).toUpperCase();
}
