import { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';

export interface LogEntry {
    timestamp: string;
    type: 'success' | 'error';
    message: string;
}

export function useLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Load logs
        browser.storage.local.get('logs').then(data => {
            setLogs((data as { logs?: LogEntry[] }).logs || []);
        });

        // Listen for log updates
        const handleStorageChange = (changes: { [key: string]: { newValue?: any } }) => {
            if (changes.logs) {
                setLogs((changes.logs.newValue as LogEntry[]) || []);
            }
        };
        browser.storage.onChanged.addListener(handleStorageChange);
        return () => browser.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const clearLogs = async () => {
        await browser.storage.local.set({ logs: [] });
    };

    return { logs, clearLogs };
}
