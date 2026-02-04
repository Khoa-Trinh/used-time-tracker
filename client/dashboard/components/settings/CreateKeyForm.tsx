import { useState, memo } from 'react';
import { Plus, Laptop } from 'lucide-react';

interface CreateKeyFormProps {
    onCreate: (label: string) => void;
    isCreating: boolean;
}

export const CreateKeyForm = memo(({ onCreate, isCreating }: CreateKeyFormProps) => {
    const [label, setLabel] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(label);
        setLabel('');
    };

    return (
        <form onSubmit={handleSubmit} className="relative group mb-8">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                <Laptop className="w-5 h-5" />
            </div>

            <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name your new device (e.g. MacBook Pro)"
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-32 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
            />

            <div className="absolute top-1 right-1 bottom-1">
                <button
                    disabled={isCreating}
                    type="submit"
                    className="h-full px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:bg-zinc-700"
                >
                    {isCreating ? (
                        <span className="animate-pulse">Generating...</span>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            <span>Create</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
});
CreateKeyForm.displayName = 'CreateKeyForm';
