import { useState, useEffect, memo } from 'react';
import { Trash2, Smartphone, Laptop, Monitor, AlertTriangle } from 'lucide-react';
import type { ApiKey } from '@/hooks/use-api-keys';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (apiKey.lastUsedAt) {
            setFormattedDate(new Date(apiKey.lastUsedAt).toLocaleDateString());
        }
    }, [apiKey.lastUsedAt]);

    const handleDelete = () => {
        onDelete(apiKey.id);
        setIsDialogOpen(false);
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger
                    render={
                        <button
                            disabled={isDeleting}
                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                            title="Revoke Key"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    }
                />
                <DialogContent className="sm:max-w-[425px] bg-zinc-950! border-white/10!">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">Revoke API Key?</DialogTitle>
                        <DialogDescription className="text-center text-zinc-400">
                            This will immediately disconnect <span className="text-zinc-200 font-semibold">{apiKey.label || 'this device'}</span>. You will need to generate a new key to reconnect it.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <DialogClose
                            render={
                                <Button variant="outline" className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-zinc-400">
                                    Cancel
                                </Button>
                            }
                        />
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Revoking...' : 'Revoke Key'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});
KeyItem.displayName = 'KeyItem';
