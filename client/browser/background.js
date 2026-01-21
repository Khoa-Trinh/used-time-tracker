// background.js

let currentTabId = null;
let startTime = null;
let currentUrl = null;

// Default URL
let serverUrl = 'http://localhost:3000/api/log-session';

// Load stored URL
chrome.storage.sync.get({ serverUrl: serverUrl }, (items) => {
    serverUrl = items.serverUrl;
    console.log('Using Server URL:', serverUrl);
});

// Detect changes to settings
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.serverUrl) {
        serverUrl = changes.serverUrl.newValue;
        console.log('Updated Server URL:', serverUrl);
    }
});

// Initialize Device ID
chrome.runtime.onInstalled.addListener(async () => {
    const data = await chrome.storage.local.get('deviceId');
    if (!data.deviceId) {
        const deviceId = `browser-${self.crypto.randomUUID()}`;
        await chrome.storage.local.set({ deviceId });
        console.log('Generated Device ID:', deviceId);
    }
});

async function getDeviceId() {
    const data = await chrome.storage.local.get('deviceId');
    return data.deviceId || 'unknown-browser-device';
}

function getAppName(url) {
    try {
        const hostname = new URL(url).hostname;
        // Basic cleanup: remove www., capitalize first letter (heuristic)
        let name = hostname.replace(/^www\./, '');
        // simple heuristic: "github.com" -> "Github.com" -> or just keep domain
        return name;
    } catch (e) {
        return 'Browser';
    }
}

async function logSession() {
    if (!startTime || !currentUrl || currentTabId === null) return;

    const endTime = new Date();
    const start = new Date(startTime);
    const duration = endTime.getTime() - start.getTime();

    // Only log if duration > 1 second and valid URL
    if (duration > 1000 && currentUrl && !currentUrl.startsWith('chrome://') && !currentUrl.startsWith('edge://') && !currentUrl.startsWith('about:')) {
        const deviceId = await getDeviceId();
        const appName = getAppName(currentUrl);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const payload = {
            deviceId,
            devicePlatform: 'web',
            appName,
            startTime: start.toISOString(),
            endTime: endTime.toISOString(),
            timeZone
        };

        // Fire and forget
        fetch(serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to log session:', err));
    }

    // Reset
    startTime = null;
    currentUrl = null;
}

async function updateActiveTab(tabId) {
    // Log previous
    await logSession();

    if (tabId === null) {
        currentTabId = null;
        return;
    }

    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.active) {
            currentTabId = tabId;
            currentUrl = tab.url;
            startTime = Date.now();
        }
    } catch (err) {
        // Tab might be closed or invalid
        console.warn('Failed to get tab info:', err);
        currentTabId = null;
        startTime = null;
    }
}

// 1. Tab Switched
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateActiveTab(activeInfo.tabId);
});

// 2. URL Changed in active tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tabId === currentTabId && changeInfo.status === 'complete') {
        // Log previous URL session if URL actually changed
        // Check if raw URL changed logic could be improved, but 'complete' is a safe trigger
        await updateActiveTab(tabId);
    }
});

// 3. Window Focus Changed
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Lost focus (clicked outside browser)
        await logSession();
        currentTabId = null;
    } else {
        // Regained focus
        const [tab] = await chrome.tabs.query({ active: true, windowId });
        if (tab) {
            await updateActiveTab(tab.id);
        }
    }
});
