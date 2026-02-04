import { useState, useEffect, memo } from 'react';
import { Trash2, Smartphone, Laptop, Monitor } from 'lucide-react';
import type { ApiKey } from '@/hooks/use-api-keys';

interface KeyItemProps {
    apiKey: ApiKey;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

const getDeviceIcon = (label: string | null) => {
    const l = (label || '').toLowerCase();
    if (l.includes('phone') || l.includes('mobile') || l.includes('iphone') || l.includes('android')) return <Smartphone className="w-5 h-5" />;
    if (l.includes('mac') || l.includes('book') || l.includes('laptop')) return <Laptop className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
};

export const KeyItem = memo(({ apiKey, onDelete, isDeleting }: KeyItemProps) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (apiKey.lastUsedAt) {
            setFormattedDate(new Date(apiKey.lastUsedAt).toLocaleDateString());
        }
    }, [apiKey.lastUsedAt]);

    const handleDelete = () => {
        if (!confirm('Revoke this API Key? This will disconnect the device immediately.')) return;
        onDelete(apiKey.id);
    };

    return (
        <div className="group flex items-center justify-between p-4 bg-zinc-900/40 border border-white/5 rounded-xl hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-200">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-zinc-800/50 rounded-lg text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {getDeviceIcon(apiKey.label)}
                </div>
                <div>
                    <p className="font-medium text-zinc-200 text-sm">{apiKey.label || 'Unnamed Device'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                        <p className="text-xs text-zinc-500 font-mono">
                            {apiKey.lastUsedAt
                                ? `Active ${formattedDate || '...'}`
                                : 'Not used yet'}
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                title="Revoke Key"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
});
KeyItem.displayName = 'KeyItem';
