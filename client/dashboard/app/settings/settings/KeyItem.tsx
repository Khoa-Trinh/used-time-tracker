import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { ApiKey } from '@/hooks/use-api-keys';

interface KeyItemProps {
    apiKey: ApiKey;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

export const KeyItem = memo(({ apiKey, onDelete, isDeleting }: KeyItemProps) => {
    const handleDelete = () => {
        if (!confirm('Are you sure? This device will stop syncing.')) return;
        onDelete(apiKey.id);
    };

    return (
        <div className="flex items-center justify-between p-3 bg-card/50 border border-border/50 rounded-lg hover:border-border transition-colors">
            <div>
                <p className="font-medium text-foreground">{apiKey.label || 'Unnamed Device'}</p>
                <p className="text-xs text-muted-foreground font-mono">
                    Last used: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}
                </p>
            </div>
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
});
KeyItem.displayName = 'KeyItem';
