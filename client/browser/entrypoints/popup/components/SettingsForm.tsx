import React from 'react';

interface SettingsFormProps {
    serverUrl: string;
    onServerUrlChange: (value: string) => void;
    apiKey: string;
    onApiKeyChange: (value: string) => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
    serverUrl,
    onServerUrlChange,
    apiKey,
    onApiKeyChange
}) => {
    return (
        <div className="glass-card form-section">
            <div className="input-group">
                <label className="label">Server Endpoint</label>
                <div className="input-wrapper">
                    <div className="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    </div>
                    <input
                        className="input"
                        type="text"
                        value={serverUrl}
                        onChange={(e) => onServerUrlChange(e.target.value)}
                        placeholder="Endpoint URL..."
                    />
                </div>
            </div>

            <div className="input-group">
                <label className="label">API Key</label>
                <div className="input-wrapper">
                    <div className="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <input
                        className="input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        placeholder="sk_..."
                    />
                </div>
            </div>
        </div>
    );
};
