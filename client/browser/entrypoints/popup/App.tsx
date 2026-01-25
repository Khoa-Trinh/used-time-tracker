import React, { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

function App() {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000/api/log-session');
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        browser.storage.sync.get({ serverUrl: 'http://localhost:3000/api/log-session', apiKey: '' })
            .then((items: any) => {
                setServerUrl(items.serverUrl);
                setApiKey(items.apiKey);
            });
    }, []);

    const saveOptions = () => {
        if (!serverUrl) {
            setStatus({ msg: 'Server URL is required', type: 'error' });
            return;
        }

        browser.storage.sync.set({ serverUrl, apiKey }).then(() => {
            setStatus({ msg: 'Settings saved successfully!', type: 'success' });
            setTimeout(() => setStatus(null), 3000);

            // Optional: Log a test session or just let background handle it
        }).catch(() => {
            setStatus({ msg: 'Failed to save settings', type: 'error' });
        });
    };

    const openDashboard = () => {
        const dashboardUrl = serverUrl.includes('localhost')
            ? 'http://localhost:3000'
            : 'https://used-time-tracker.vercel.app'; // basic heuristic or could be a separate setting

        browser.tabs.create({ url: dashboardUrl });
    };

    return (
        <div className="container">
            <header className="header">
                <h1 className="title">Time Tracker</h1>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: apiKey ? '#10b981' : '#71717a' }} title={apiKey ? "Configured" : "Not Configured"} />
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

            <div className={`status ${status?.type === 'error' ? 'error' : ''}`}>
                {status?.msg}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button
                    className="button"
                    style={{ flex: 1, background: '#27272a' }}
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
