import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Bet, BetType, Outcome, Selection } from '../types';

interface Lucky15ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bet: Bet) => void;
    initialBet?: Bet;
}

const DEFAULT_SELECTION: Selection = {
    id: '',
    horse: '',
    outcome: Outcome.PENDING,
    odds: '',
    placeFraction: 5,
};

export const Lucky15Modal: React.FC<Lucky15ModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialBet,
}) => {
    const [bookie, setBookie] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [stake, setStake] = useState<number | ''>('');
    const [isEachWay, setIsEachWay] = useState(true);
    const [selections, setSelections] = useState<Selection[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (initialBet) {
                setBookie(initialBet.bookie);
                setDate(initialBet.date);
                setStake(initialBet.stake);
                setIsEachWay(initialBet.isEachWay);
                setSelections(
                    initialBet.selections || [
                        { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                        { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                        { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                        { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                    ]
                );
            } else {
                setBookie('');
                setDate(new Date().toISOString().split('T')[0]);
                setStake('');
                setIsEachWay(true);
                setSelections([
                    { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                    { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                    { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                    { ...DEFAULT_SELECTION, id: crypto.randomUUID() },
                ]);
            }
        }
    }, [isOpen, initialBet]);

    const handleSelectionChange = (
        index: number,
        field: keyof Selection,
        value: string | number | boolean
    ) => {
        const newSelections = [...selections];
        newSelections[index] = { ...newSelections[index], [field]: value };
        setSelections(newSelections);
    };

    const handleSave = () => {
        const newBet: Bet = {
            id: initialBet?.id || crypto.randomUUID(),
            type: BetType.LUCKY_15,
            bookie,
            date,
            stake,
            isEachWay,
            horse: 'Lucky 15', // Summary
            trainer: '',
            jockey: '',
            odds: '', // Not applicable for the whole bet
            outcome: Outcome.PENDING, // Will be calculated
            placeFraction: '', // Per selection
            selections,
        };
        onSave(newBet);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl my-8">
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-card-foreground">
                        {initialBet ? 'Edit Lucky 15' : 'Add Lucky 15'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* General Bet Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bookie</label>
                            <Input
                                value={bookie}
                                onChange={(e) => setBookie(e.target.value)}
                                placeholder="e.g. Bet365"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Unit Stake</label>
                            <Input
                                type="number"
                                value={stake}
                                onChange={(e) =>
                                    setStake(e.target.value === '' ? '' : Number(e.target.value))
                                }
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="ew"
                                checked={isEachWay}
                                onCheckedChange={(c) => setIsEachWay(c === true)}
                            />
                            <label
                                htmlFor="ew"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Each Way
                            </label>
                        </div>
                    </div>

                    {/* Selections */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Selections</h3>
                        <div className="grid gap-4">
                            {selections.map((selection, index) => (
                                <div
                                    key={selection.id}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 border border-border rounded-md bg-muted/20"
                                >
                                    <div className="sm:col-span-1 flex items-center justify-center font-bold text-muted-foreground">
                                        #{index + 1}
                                    </div>
                                    <div className="sm:col-span-4 space-y-1">
                                        <label className="text-xs text-muted-foreground">Horse</label>
                                        <Input
                                            value={selection.horse}
                                            onChange={(e) =>
                                                handleSelectionChange(index, 'horse', e.target.value)
                                            }
                                            placeholder="Horse Name"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="text-xs text-muted-foreground">Odds</label>
                                        <Input
                                            type="number"
                                            value={selection.odds}
                                            onChange={(e) =>
                                                handleSelectionChange(
                                                    index,
                                                    'odds',
                                                    e.target.value === '' ? '' : Number(e.target.value)
                                                )
                                            }
                                            placeholder="Dec"
                                        />
                                    </div>
                                    {isEachWay && (
                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-xs text-muted-foreground">
                                                Place Terms (1/x)
                                            </label>
                                            <Input
                                                type="number"
                                                value={selection.placeFraction}
                                                onChange={(e) =>
                                                    handleSelectionChange(
                                                        index,
                                                        'placeFraction',
                                                        e.target.value === '' ? '' : Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className="sm:col-span-3 space-y-1">
                                        <label className="text-xs text-muted-foreground">Outcome</label>
                                        <Select
                                            value={selection.outcome}
                                            onValueChange={(val) =>
                                                handleSelectionChange(index, 'outcome', val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(Outcome).map((o) => (
                                                    <SelectItem key={o} value={o}>
                                                        {o}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 p-6 border-t border-border bg-muted/10">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Bet</Button>
                </div>
            </div>
        </div>
    );
};
