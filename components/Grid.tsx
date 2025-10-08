import React from 'react';
import type { Bet } from '../types';
import { Outcome } from '../types';

interface CalculatedBet extends Bet {
    profitLoss: number;
    runningProfitLoss: number;
}
interface BettingTableProps {
  bets: CalculatedBet[];
  onUpdateBet: (betId: string, field: keyof Omit<Bet, 'id'>, value: string | number | boolean) => void;
  onDeleteBet: (betId: string) => void;
}

const outcomeOptions = Object.values(Outcome);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ProfitLossCell: React.FC<{ value: number }> = ({ value }) => {
    const color = value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-gray-400';
    return (
        <td className={`p-2 border-r border-b border-gray-700 font-mono text-right ${color}`}>
            {value.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
        </td>
    )
}

export const BettingTable: React.FC<BettingTableProps> = ({ bets, onUpdateBet, onDeleteBet }) => {
    
    const handleInputChange = (id: string, field: keyof Omit<Bet, 'id'>, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        const isNumeric = field === 'odds' || field === 'stake' || field === 'placeFraction';
        onUpdateBet(id, field, isNumeric && value !== '' ? parseFloat(value) : value);
    };
    
    const headers = ['Bookie', 'Date', 'Horse', 'Trainer', 'Jockey', 'Odds', 'Stake', 'E/W', 'Place Terms', 'Outcome', 'Profit/Loss', 'Running P/L', 'Actions'];

  return (
    <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-700">
            <thead className="bg-gray-800 text-gray-300">
                <tr>
                    {headers.map((h) => (
                        <th key={h} className="sticky top-0 bg-gray-800 p-2 border-r border-b border-gray-700 text-left font-semibold text-gray-300 whitespace-nowrap text-sm">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {bets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-gray-800/50 text-sm">
                        {/* FIX: Use 'as const' to provide a strong type for the mapped fields, avoiding type errors on the input value. */}
                        {([
                            { field: 'bookie', type: 'text'},
                            { field: 'date', type: 'date'},
                            { field: 'horse', type: 'text'},
                            { field: 'trainer', type: 'text'},
                            { field: 'jockey', type: 'text'},
                            { field: 'odds', type: 'number'},
                            { field: 'stake', type: 'number'},
                        ] as const).map(({ field, type }) => (
                            <td key={field} className="p-0 border-r border-b border-gray-700">
                                <input
                                    type={type}
                                    value={bet[field]}
                                    onChange={(e) => handleInputChange(bet.id, field, e)}
                                    className="w-full h-full p-2 bg-transparent text-gray-200 focus:bg-gray-700 focus:outline-none"
                                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                    step={type === 'number' ? '0.01' : undefined}
                                />
                            </td>
                        ))}
                        <td className="p-2 border-r border-b border-gray-700 text-center align-middle">
                            <input
                                type="checkbox"
                                checked={bet.isEachWay}
                                onChange={(e) => onUpdateBet(bet.id, 'isEachWay', e.target.checked)}
                                className="w-5 h-5 bg-gray-700 border-gray-500 rounded text-brand-primary focus:ring-brand-primary focus:ring-2"
                                aria-label="Each Way Bet"
                            />
                        </td>
                        <td className="p-0 border-r border-b border-gray-700">
                            {bet.isEachWay && (
                                <div className="flex items-center">
                                    <span className="p-2 text-gray-400">1/</span>
                                    <input
                                        type="number"
                                        value={bet.placeFraction}
                                        onChange={(e) => handleInputChange(bet.id, 'placeFraction', e)}
                                        className="w-full h-full p-2 bg-transparent text-gray-200 focus:bg-gray-700 focus:outline-none"
                                        placeholder="5"
                                        min="1"
                                    />
                                </div>
                            )}
                        </td>
                        <td className="p-0 border-r border-b border-gray-700">
                             <select
                                value={bet.outcome}
                                onChange={(e) => handleInputChange(bet.id, 'outcome', e)}
                                className="w-full h-full p-2 bg-transparent text-gray-200 focus:bg-gray-700 focus:outline-none border-0 appearance-none"
                             >
                                {outcomeOptions.map(option => (
                                    <option key={option} value={option} className="bg-gray-700 text-white">{option}</option>
                                ))}
                             </select>
                        </td>
                        <ProfitLossCell value={bet.profitLoss} />
                        <ProfitLossCell value={bet.runningProfitLoss} />
                        <td className="p-2 border-r border-b border-gray-700 text-center">
                            <button 
                                onClick={() => onDeleteBet(bet.id)} 
                                className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10 transition-colors"
                                aria-label={`Delete bet on ${bet.horse}`}
                            >
                                <TrashIcon />
                            </button>
                        </td>
                    </tr>
                ))}
                {bets.length === 0 && (
                    <tr>
                        <td colSpan={headers.length} className="text-center p-4 text-gray-500">
                            No bets found. Click "+ Add Bet" to get started.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );
};