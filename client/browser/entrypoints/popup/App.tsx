import React, { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

function App() {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000/api/log-session');
    const [apiKey, setApiKey] = useState('');
    const [dashboardUrl, setDashboardUrl] = useState('http://localhost:3000');
    const [status, setStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        // Load settings and theme
        browser.storage.sync.get({
            serverUrl: 'http://localhost:3000/api/log-session',
            apiKey: '',
            dashboardUrl: 'http://localhost:3000',
            theme: 'dark'
        })
            .then((items: any) => {
                setServerUrl(items.serverUrl);
                setApiKey(items.apiKey);
                setDashboardUrl(items.dashboardUrl);
                setTheme(items.theme || 'dark');
                document.documentElement.setAttribute('data-theme', items.theme || 'dark');
            });
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        browser.storage.sync.set({ theme: newTheme });
    };

    const saveOptions = () => {
        if (!serverUrl) {
            setStatus({ msg: 'Server URL is required', type: 'error' });
            return;
        }

        browser.storage.sync.set({ serverUrl, apiKey, dashboardUrl }).then(() => {
            setStatus({ msg: 'Settings saved successfully!', type: 'success' });
            setTimeout(() => setStatus(null), 3000);
        }).catch(() => {
            setStatus({ msg: 'Failed to save settings', type: 'error' });
        });
    };

    const openDashboard = () => {
        browser.tabs.create({ url: dashboardUrl });
    };

    return (
        <div className="container">
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 className="title">Time Tracker</h1>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: apiKey ? '#10b981' : '#71717a' }} title={apiKey ? "Configured" : "Not Configured"} />
                </div>
                <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    )}
                </button>
            </header>

            <div className="form-group">
                <label className="label" htmlFor="serverUrl">Server Endpoint</label>
                <input
                    id="serverUrl"
                    className="input"
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://localhost:3000/api/log-session"
                />
                <span className="helper-text">Endpoint ending in /api/log-session</span>
            </div>

            <div className="form-group">
                <label className="label" htmlFor="apiKey">API Key</label>
                <input
                    id="apiKey"
                    className="input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_..."
                />
                <span className="helper-text">Required for Hosted Mode</span>
            </div>

            <div className="form-group">
                <label className="label" htmlFor="dashboardUrl">Dashboard URL</label>
                <input
                    id="dashboardUrl"
                    className="input"
                    type="text"
                    value={dashboardUrl}
                    onChange={(e) => setDashboardUrl(e.target.value)}
                    placeholder="http://localhost:3000"
                />
                <span className="helper-text">Base URL for the dashboard</span>
            </div>

            <div className={`status ${status?.type === 'error' ? 'error' : ''}`}>
                {status?.msg}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button
                    className="button button-secondary"
                    style={{ flex: 1 }}
                    onClick={openDashboard}
                >
                    Dashboard
                </button>
                <button className="button" style={{ flex: 1 }} onClick={saveOptions}>
                    Save Changes
                </button>
            </div>
        </div>
    );
}

export default App;
