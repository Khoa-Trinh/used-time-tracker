'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { ArrowLeft, Plus, Trash2, Key, Copy, Check } from 'lucide-react';


interface ApiKey {
    id: string;
    label: string;
    key?: string; // Only shown once on creation
    createdAt: string;
    lastUsedAt: string | null;
}

export default function SettingsClient() {
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [newLabel, setNewLabel] = useState('');
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
            const res = await fetch(`${baseUrl}/api/keys`, { credentials: 'include' });

            if (res.status === 401) {
                await authClient.signOut();
                router.push('/login');
                return;
            }

            const json = await res.json();
            if (json.success) setKeys(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
            const res = await fetch(`${baseUrl}/api/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: newLabel || 'My Device' }),
                credentials: 'include'
            });

            if (res.status === 401) {
                await authClient.signOut();
                router.push('/login');
                return;
            }

            const json = await res.json();

            if (json.success) {
                setNewKey(json.key);
                setNewLabel('');
                fetchKeys();
            }
        } finally {
            setCreating(false);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm('Are you sure? This device will stop syncing.')) return;
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
        const res = await fetch(`${baseUrl}/api/keys/${id}`, { method: 'DELETE', credentials: 'include' });

        if (res.status === 401) {
            await authClient.signOut();
            router.push('/login');
            return;
        }

        fetchKeys();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Settings</h1>
                </header>

                <section className="bg-card border border-border rounded-xl p-6 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Device API Keys</h2>
                            <p className="text-sm text-muted-foreground">Generate keys to connect your devices in Hosted Mode.</p>
                        </div>
                    </div>

                    <form onSubmit={createKey} className="flex gap-2 mb-8">
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Device Name (e.g. Work Laptop)"
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-ring outline-none transition-all placeholder:text-muted-foreground"
                        />
                        <button
                            disabled={creating}
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Generate
                        </button>
                    </form>

                    {newKey && (
                        <div
                            className="mb-8 bg-primary/10 border border-primary/20 rounded-lg p-4"
                        >
                            <p className="text-primary text-sm font-medium mb-2">New API Key Generated:</p>
                            <div className="flex items-center gap-2 bg-muted border border-border rounded p-2 font-mono text-sm text-foreground">
                                <span className="flex-1 truncate">{newKey}</span>
                                <button onClick={() => copyToClipboard(newKey)} className="p-1 hover:text-primary transition-colors">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-muted-foreground text-xs mt-2">
                                Copy this key immediately. It will not be shown again.
                                <br />
                                Add it to your <code className="text-foreground bg-muted px-1 rounded">config.json</code> as <code className="text-foreground bg-muted px-1 rounded">"apiKey": "..."</code>
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {keys.map(key => (
                            <div key={key.id} className="flex items-center justify-between p-3 bg-card/50 border border-border/50 rounded-lg hover:border-border transition-colors">
                                <div>
                                    <p className="font-medium text-foreground">{key.label}</p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteKey(key.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {keys.length === 0 && !loading && (
                            <p className="text-center text-muted-foreground py-4 text-sm">No keys generated yet.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
