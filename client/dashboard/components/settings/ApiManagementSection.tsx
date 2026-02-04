import { useState, useEffect } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { CreateKeyForm } from './CreateKeyForm';
import { NewKeyDisplay } from './NewKeyDisplay';
import { KeysList } from './KeysList';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export function ApiManagementSection() {
    const { keys, isLoading, createKey, isCreating, deleteKey, isDeleting } = useApiKeys();
    const [newKey, setNewKey] = useState<string | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    const handleCreate = (label: string) => {
        createKey(label, {
            onSuccess: (data: any) => {
                if (data.success && data.key) {
                    setNewKey(data.key);
                }
            }
        });
    };

    const renderSkeletons = () => (
        <>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-lg bg-zinc-800/50" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-zinc-800/50" />
                            <Skeleton className="h-3 w-48 bg-zinc-800/50" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className="space-y-6">
            <CreateKeyForm onCreate={handleCreate} isCreating={isCreating} />

            <AnimatePresence mode="popLayout">
                {newKey && (
                    <motion.div
                        key="new-key"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    >
                        <NewKeyDisplay
                            apiKey={newKey}
                            onDismiss={() => setNewKey(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3 min-h-[200px] relative">
                <AnimatePresence mode="wait">
                    {!hasHydrated || isLoading ? (
                        <motion.div
                            key="skeletons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {renderSkeletons()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full"
                        >
                            <KeysList
                                keys={keys}
                                onDelete={deleteKey}
                                isDeleting={isDeleting}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
