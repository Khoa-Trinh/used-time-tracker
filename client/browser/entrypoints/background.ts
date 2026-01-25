import { browser } from 'wxt/browser';

export default defineBackground(() => {


  // In-memory cache for critical state to reduce storage reads
  let stateCache: Record<string, any> = {};
  let configCache: { serverUrl: string, apiKey: string } | null = null;
  let deviceIdCache: string | null = null;

  // Initialize config cache
  browser.storage.sync.get({
    serverUrl: 'http://localhost:3000/api/log-session',
    apiKey: ''
  }).then((items) => {
    configCache = items as { serverUrl: string, apiKey: string };
  });

  // Listen for config changes
  browser.storage.onChanged.addListener((changes: any, areaName: string) => {
    if (areaName === 'sync') {
      if (changes.serverUrl) configCache!.serverUrl = changes.serverUrl.newValue;
      if (changes.apiKey) configCache!.apiKey = changes.apiKey.newValue;
    }
  });

  // State management using storage.session to survive SW termination
  // But coupled with in-memory cache for speed during session
  const setState = async (key: string, value: any) => {
    stateCache[key] = value;
    await browser.storage.session.set({ [key]: value });
  };

  const getState = async (key: string): Promise<any> => {
    if (stateCache[key] !== undefined) return stateCache[key];
    const data = await browser.storage.session.get(key);
    stateCache[key] = data[key];
    return data[key];
  };

  const getDeviceId = async () => {
    if (deviceIdCache) return deviceIdCache;
    const data = await browser.storage.local.get('deviceId') as { deviceId: string };
    if (!data.deviceId) {
      const deviceId = `browser-${crypto.randomUUID()}`;
      await browser.storage.local.set({ deviceId });
      deviceIdCache = deviceId;
      return deviceId;
    }
    deviceIdCache = data.deviceId;
    return data.deviceId;
  };

  const getAppName = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '');
    } catch {
      return 'Browser';
    }
  };



  let logLock = Promise.resolve();

  const _performLogSession = async (shouldReset: boolean = true) => {
    // fast read from cache if available
    const startTime = await getState('startTime');
    const currentUrl = await getState('currentUrl');

    if (!startTime || !currentUrl) return;

    const endTime = Date.now();
    const start = new Date(startTime);
    const duration = endTime - start.getTime();

    // Prevent double logging by immediately updating/clearing start time
    if (shouldReset) {
      await setState('startTime', null);
      await setState('currentUrl', null);
    } else {
      await setState('startTime', endTime); // Next session starts now
    }

    if (duration > 1000 && typeof currentUrl === 'string' && !currentUrl.startsWith('chrome://') && !currentUrl.startsWith('about:')) {

      // Use cached config if available
      let serverUrl = 'http://localhost:3000/api/log-session';
      let apiKey = '';

      if (configCache) {
        serverUrl = configCache.serverUrl;
        apiKey = configCache.apiKey;
      } else {
        // Fallback if cache not ready (unlikely after startup)
        const items = await browser.storage.sync.get({
          serverUrl,
          apiKey
        }) as { serverUrl: string, apiKey: string };
        serverUrl = items.serverUrl;
        apiKey = items.apiKey;
        configCache = { serverUrl, apiKey };
      }

      const deviceId = await getDeviceId();
      const appName = getAppName(currentUrl);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const payload = {
        deviceId,
        devicePlatform: 'web',
        appName,
        startTime: start.toISOString(),
        endTime: new Date(endTime).toISOString(),
        timeZone
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      fetch(serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).catch(err => console.error('Failed to log session:', err));
    }
  };

  const logSession = _performLogSession;

  const updateActiveTab = async (tabId: number | null) => {
    await logSession(true);

    if (tabId === null) {
      await setState('currentTabId', null);
      return;
    }

    try {
      const tab = await browser.tabs.get(tabId);
      if (tab.active) {
        await setState('currentTabId', tabId);
        await setState('currentUrl', tab.url);
        await setState('startTime', Date.now());
      }
    } catch (err) {
      // If the tab is gone, we just clear the state
      await setState('currentTabId', null);
      await setState('startTime', null);
    }
  };

  // Events
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    await updateActiveTab(activeInfo.tabId);
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const currentTabId = await getState('currentTabId');
    if (tabId === currentTabId && (changeInfo.url || changeInfo.status === 'complete')) {
      const savedUrl = await getState('currentUrl');
      if (tab.url && tab.url !== savedUrl) {
        // SPA Check: If the App Name (Domain) is the same, just update the URL pointer
        // This prevents fragmenting sessions when navigating inside YouTube/Gmail etc.
        const oldAppName = getAppName(savedUrl || '');
        const newAppName = getAppName(tab.url);

        if (oldAppName === newAppName) {
          await setState('currentUrl', tab.url);
        } else {
          await updateActiveTab(tabId);
        }
      }
    }
  });

  browser.tabs.onRemoved.addListener(async (tabId) => {
    const currentTabId = await getState('currentTabId');
    if (tabId === currentTabId) {
      await logSession(true);
      await setState('currentTabId', null);
    }
  });

  // Graceful Shutdown for Browser
  // Tried to log the final session when the browser is closing or extension is disabled
  browser.runtime.onSuspend.addListener(() => {
    // Note: We cannot await here, so we fire and forget
    logSession(true);
  });
});
