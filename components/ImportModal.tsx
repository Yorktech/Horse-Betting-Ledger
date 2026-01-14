import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { parseBet365Text } from '../lib/bet365Parser';
import { Bet } from '../types';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (bets: Bet[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
}) => {
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleImport = () => {
        try {
            const bets = parseBet365Text(text);
            if (bets.length === 0) {
                setError('No bets could be parsed. Please check the format.');
                return;
            }
            onImport(bets);
            onClose();
            setText('');
            setError(null);
        } catch (e) {
            setError('An error occurred during parsing.');
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                        <Upload className="h-6 w-6" />
                        Import Bets
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Paste your copied text from Bet365 history below.
                    </p>
                    <Textarea
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Paste bet history here..."
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            setError(null);
                        }}
                    />
                    {error && (
                        <p className="text-sm text-destructive font-medium">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-4 p-6 border-t border-border bg-muted/10">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!text.trim()}>
                        Import Bets
                    </Button>
                </div>
            </div>
        </div>
    );
};
