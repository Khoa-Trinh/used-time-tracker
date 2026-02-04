import { useState, memo } from 'react';
import { Copy, Check, TriangleAlert } from 'lucide-react';

interface NewKeyDisplayProps {
    apiKey: string;
    onDismiss?: () => void;
}

export const NewKeyDisplay = memo(({ apiKey }: NewKeyDisplayProps) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mb-8 relative overflow-hidden bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>

            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <TriangleAlert className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-zinc-200 font-medium">Save your Secret Key</h3>
                    <p className="text-zinc-400 text-sm mt-1">
                        This key will not be shown again. Copy it now and add it to your trackers.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-900 rounded-lg p-3 group">
                <code className="flex-1 font-mono text-indigo-300 text-sm break-all">{apiKey}</code>
                <button
                    onClick={copyToClipboard}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="Copy to clipboard"
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            <div className="mt-4 flex gap-2 text-xs text-zinc-500 font-mono bg-black/20 p-2 rounded border border-white/5">
                <span className="text-indigo-400 shrink-0">config.json:</span>
                <span className="truncate">"apiKey": "{apiKey}"</span>
            </div>
        </div>
    );
});
NewKeyDisplay.displayName = 'NewKeyDisplay';
