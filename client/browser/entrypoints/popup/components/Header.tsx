import React from 'react';

interface HeaderProps {
    apiKey: string;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, theme, onToggleTheme }) => {
    return (
        <header className="header">
            <div className="brand-wrapper">
                <h1 className="title">The Tick</h1>
                <div
                    className="status-dot"
                    style={{
                        color: apiKey ? '#10b981' : '#71717a',
                        backgroundColor: apiKey ? '#10b981' : '#71717a'
                    }}
                    title={apiKey ? "Active" : "Key Missing"}
                />
            </div>
            <button
                className="theme-btn"
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
                {theme === 'dark' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                )}
            </button>
        </header>
    );
};
