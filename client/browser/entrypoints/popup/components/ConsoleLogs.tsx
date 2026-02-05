import React from 'react';
import { LogEntry } from '../hooks/use-logs';

interface ConsoleLogsProps {
    logs: LogEntry[];
    onClear: () => void;
}

export const ConsoleLogs: React.FC<ConsoleLogsProps> = ({ logs, onClear }) => {
    return (
        <div className="logs-section">
            <div className="logs-header">
                <span className="label">Activity Monitor</span>
                {logs.length > 0 && (
                    <button type="button" className="clear-logs" onClick={onClear}>
                        Clear logs
                    </button>
                )}
            </div>
            <div className="logs-container">
                {logs.length === 0 ? (
                    <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0', fontSize: '12px' }}>
                        No system activity detected
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="log-item">
                            <div className="log-meta">
                                <span className={`log-msg ${log.type === 'success' ? 'log-success-text' : 'log-error-text'}`}>
                                    {log.type === 'success' ? '● Success' : '● Error'}
                                </span>
                                <span className="log-time">
                                    {new Date(log.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="log-msg" style={{ color: 'var(--text-color)', marginTop: '2px' }}>
                                {log.message}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
