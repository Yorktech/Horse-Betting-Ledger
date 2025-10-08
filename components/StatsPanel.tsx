import React from 'react';

interface Stats {
    startBank: number;
    currentBank: number;
    runningProfitLoss: number;
    wins: number;
    places: number;
    losses: number;
    totalBets: number;
}

interface StatsPanelProps {
  stats: Stats;
  onStartBankChange: (value: number) => void;
}

const StatRow: React.FC<{ label: string; value: string | number; isCurrency?: boolean; }> = ({ label, value, isCurrency = true }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold font-mono text-gray-100">
            {isCurrency ? Number(value).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }) : value}
        </span>
    </div>
);

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, onStartBankChange }) => {
    const { startBank, currentBank, runningProfitLoss, wins, places, losses, totalBets } = stats;

    const spendPerBet2 = currentBank * 0.02;
    const spendPerBet5 = currentBank * 0.05;

    return (
        <div className="bg-gray-800/50 p-4 space-y-6">
            <div>
                <h2 className="text-lg font-bold text-white border-b border-gray-600 pb-2 mb-2">Bank</h2>
                <div className="flex justify-between items-center py-2">
                    <label htmlFor="start-bank" className="text-gray-400">Start</label>
                    <input 
                        id="start-bank"
                        type="number"
                        value={startBank}
                        onChange={(e) => onStartBankChange(parseFloat(e.target.value) || 0)}
                        className="w-28 p-1 bg-gray-700 text-white font-mono text-right rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        prefix="£"
                    />
                </div>
                <StatRow label="Current" value={currentBank} />
                <StatRow label="Running Profit / Loss" value={runningProfitLoss} />
                <StatRow label="Spend per bet 2%" value={spendPerBet2} />
                <StatRow label="Spend per bet 5%" value={spendPerBet5} />
            </div>
            
            <div>
                <h2 className="text-lg font-bold text-white border-b border-gray-600 pb-2 mb-2">Totals</h2>
                <StatRow label="Wins" value={wins} isCurrency={false} />
                <StatRow label="Places" value={places} isCurrency={false} />
                <StatRow label="Losses" value={losses} isCurrency={false} />
                <StatRow label="Total Bets" value={totalBets} isCurrency={false} />
            </div>

            <div>
                <h2 className="text-lg font-bold text-white border-b border-gray-600 pb-2 mb-2">Rules</h2>
                <ul className="text-gray-400 list-disc list-inside space-y-1 bg-orange-900/20 p-3 rounded-md">
                    <li>Odds nothing below 5, nothing higher than 35</li>
                    <li>Always EW</li>
                    <li>Race has to have extra places</li>
                    <li>Compound stake</li>
                    <li>Lay the win</li>
                </ul>
            </div>
        </div>
    );
};
