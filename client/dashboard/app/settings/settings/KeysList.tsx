import { memo } from 'react';
import { KeyItem } from './KeyItem';
import { ApiKey } from '@/hooks/use-api-keys';

interface KeysListProps {
    keys: ApiKey[];
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

export const KeysList = memo(({ keys, onDelete, isDeleting }: KeysListProps) => {
    if (keys.length === 0) {
        return <p className="text-center text-muted-foreground py-4 text-sm">No keys generated yet.</p>;
    }

    return (
        <>
            {keys.map((key) => (
                <KeyItem key={key.id} apiKey={key} onDelete={onDelete} isDeleting={isDeleting} />
            ))}
        </>
    );
});
KeysList.displayName = 'KeysList';
