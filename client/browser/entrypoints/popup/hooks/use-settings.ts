import { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';

export function useSettings() {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000/api/log-session');
    const [apiKey, setApiKey] = useState('');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [status, setStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        browser.storage.sync.get({
            serverUrl: 'http://localhost:3000/api/log-session',
            apiKey: '',
            theme: 'dark'
        }).then((items: any) => {
            setServerUrl(items.serverUrl);
            setApiKey(items.apiKey);
            const initialTheme = items.theme || 'dark';
            setTheme(initialTheme);
            document.documentElement.setAttribute('data-theme', initialTheme);
        });
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        browser.storage.sync.set({ theme: newTheme });
    };

    const saveSettings = () => {
        if (!serverUrl) {
            setStatus({ msg: 'Server URL is required', type: 'error' });
            return;
        }

        browser.storage.sync.set({ serverUrl, apiKey }).then(() => {
            setStatus({ msg: 'Settings saved successfully!', type: 'success' });
            setTimeout(() => setStatus(null), 3000);
        }).catch(() => {
            setStatus({ msg: 'Failed to save settings', type: 'error' });
        });
    };

    const getDashboardUrl = () => {
        try {
            const url = new URL(serverUrl);
            return `${url.protocol}//${url.host}`;
        } catch {
            return 'http://localhost:3000';
        }
    };

    return {
        serverUrl,
        setServerUrl,
        apiKey,
        setApiKey,
        theme,
        toggleTheme,
        status,
        saveSettings,
        getDashboardUrl
    };
}
