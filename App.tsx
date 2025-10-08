import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { BettingTable } from './components/Grid';
import { StatsPanel } from './components/StatsPanel';
import { Toast } from './components/Toast';
import { fetchData, saveData } from './services/supabaseService';
import type { Bet, ToastMessage } from './types';
import { Outcome } from './types';

const LoadingSkeleton: React.FC = () => (
    <div className="p-4 w-full">
        <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-full mb-2"></div>
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-800 rounded w-full mb-1"></div>
            ))}
        </div>
    </div>
);


const App: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [startBank, setStartBank] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchData();
      setBets(data);
    } catch (error) {
      setToast({ id: Date.now(), message: 'Failed to load data.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculatedBets = useMemo(() => {
    let runningTotal = 0;
    return bets.map(bet => {
        const { odds, stake, outcome, isEachWay, placeFraction } = bet;
        let profitLoss = 0;

        const stakeNum = typeof stake === 'number' && stake > 0 ? stake : 0;
        const oddsNum = typeof odds === 'number' && odds > 0 ? odds : 0;
        const placeFractionNum = typeof placeFraction === 'number' && placeFraction > 0 ? placeFraction : 0;

        if (stakeNum > 0 && oddsNum > 0) {
            if (isEachWay) {
                // EACH-WAY BET CALCULATION
                // Stake is unit stake. Total stake is stake * 2.
                if (placeFractionNum > 0) {
                    const winProfit = stakeNum * oddsNum;
                    const placeProfit = stakeNum * (oddsNum / placeFractionNum);

                    switch (outcome) {
                        case Outcome.WON:
                            profitLoss = winProfit + placeProfit;
                            break;
                        case Outcome.PLACED:
                            profitLoss = placeProfit - stakeNum; // Win part of stake is lost
                            break;
                        case Outcome.LOST:
                            profitLoss = -stakeNum * 2; // Both parts lose
                            break;
                        case Outcome.VOID:
                            profitLoss = 0; // Stake is returned
                            break;
                        default:
                            profitLoss = 0;
                    }
                }
            } else {
                // WIN-ONLY BET CALCULATION
                switch (outcome) {
                    case Outcome.WON:
                        profitLoss = stakeNum * oddsNum;
                        break;
                    case Outcome.PLACED: // A place on a win-only bet is a loss
                    case Outcome.LOST:
                        profitLoss = -stakeNum;
                        break;
                    case Outcome.VOID:
                        profitLoss = 0; // Stake is returned
                        break;
                    default:
                        profitLoss = 0;
                }
            }
        }
        
        runningTotal += profitLoss;
        return { ...bet, profitLoss, runningProfitLoss: runningTotal };
    });
  }, [bets]);
  
  const stats = useMemo(() => {
    const runningProfitLoss = calculatedBets[calculatedBets.length - 1]?.runningProfitLoss || 0;
    return {
        startBank,
        currentBank: startBank + runningProfitLoss,
        runningProfitLoss,
        wins: bets.filter(b => b.outcome === Outcome.WON).length,
        places: bets.filter(b => b.outcome === Outcome.PLACED).length,
        losses: bets.filter(b => b.outcome === Outcome.LOST).length,
        totalBets: bets.filter(b => b.outcome !== Outcome.PENDING).length,
    }
  }, [bets, startBank, calculatedBets]);

  const handleUpdateBet = (betId: string, field: keyof Omit<Bet, 'id'>, value: string | number | boolean) => {
    setBets(prevBets => 
        prevBets.map(bet => 
            bet.id === betId ? { ...bet, [field]: value } : bet
        )
    );
  };

  const handleAddBet = () => {
    const newBet: Bet = {
      id: `bet-${Date.now()}`,
      bookie: '',
      date: new Date().toISOString().split('T')[0],
      horse: '',
      trainer: '',
      jockey: '',
      odds: '',
      stake: '',
      outcome: Outcome.PENDING,
      isEachWay: true,
      placeFraction: 5,
    };
    setBets([...bets, newBet]);
  };

  const handleDeleteBet = (betId: string) => {
    setBets(prevBets => prevBets.filter(bet => bet.id !== betId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveData(bets);
      setToast({ id: Date.now(), message: 'Ledger saved successfully!', type: 'success' });
    } catch (error) {
      setToast({ id: Date.now(), message: 'Failed to save data. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans">
      <Header onAddBet={handleAddBet} onSave={handleSave} isSaving={isSaving} />
      <main className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow">
                 {isLoading ? (
                    <LoadingSkeleton />
                    ) : (
                    <BettingTable 
                        bets={calculatedBets} 
                        onUpdateBet={handleUpdateBet} 
                        onDeleteBet={handleDeleteBet}
                    />
                    )}
            </div>
            <div className="w-full lg:w-80 lg:flex-shrink-0">
                <StatsPanel stats={stats} onStartBankChange={setStartBank} />
            </div>
        </div>
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;