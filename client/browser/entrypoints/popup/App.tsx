import React from 'react';
import { browser } from 'wxt/browser';
import { useSettings } from './hooks/use-settings';
import { useLogs } from './hooks/use-logs';
import { Header } from './components/Header';
import { SettingsForm } from './components/SettingsForm';
import { ConsoleLogs } from './components/ConsoleLogs';

function App() {
    const {
        serverUrl,
        setServerUrl,
        apiKey,
        setApiKey,
        theme,
        toggleTheme,
        status,
        saveSettings,
        getDashboardUrl
    } = useSettings();

    const { logs, clearLogs } = useLogs();

    const openDashboard = () => {
        browser.tabs.create({ url: getDashboardUrl() });
    };

    return (
        <div className="container">
            <Header
                apiKey={apiKey}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            <SettingsForm
                serverUrl={serverUrl}
                onServerUrlChange={setServerUrl}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
            />

            <ConsoleLogs
                logs={logs}
                onClear={clearLogs}
            />

            {status && (
                <div className={`status-toast ${status.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {status.msg}
                </div>
            )}

            <div className="footer-actions">
                <button
                    className="btn btn-secondary"
                    onClick={openDashboard}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                    Dashboard
                </button>
                <button
                    className="btn btn-primary"
                    onClick={saveSettings}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                    Save
                </button>
            </div>
        </div>
    );
}

export default App;
