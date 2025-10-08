import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { BettingTable } from './components/Grid';
import { StatsPanel } from './components/StatsPanel';
import { Toast } from './components/Toast';
import { fetchData, saveData } from './services/supabaseService';
import { isSupabaseConfigured } from './services/supabaseClient';
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

const SupabaseSetupInstructions: React.FC = () => (
  <div className="fixed inset-0 bg-brand-dark bg-opacity-95 z-50 flex items-center justify-center p-4 sm:p-8" aria-modal="true" role="dialog">
    <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-700 transform transition-all" role="document">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Configuration Needed</h2>
      <p className="text-gray-300 mb-6">
        To save your data, you need to connect this app to your Supabase project. Please add your Supabase credentials using the secret manager for this environment.
      </p>
      <div className="space-y-4">
        <div className="bg-gray-900 p-4 rounded-md">
          <label htmlFor="supabase-url-secret" className="block text-sm font-medium text-gray-400 mb-1">Secret Name</label>
          <code id="supabase-url-secret" className="text-lg text-green-400 bg-gray-700 px-2 py-1 rounded">SUPABASE_URL</code>
          <p className="text-xs text-gray-500 mt-1">Find this in your Supabase project settings under "API".</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-md">
          <label htmlFor="supabase-key-secret" className="block text-sm font-medium text-gray-400 mb-1">Secret Name</label>
          <code id="supabase-key-secret" className="text-lg text-green-400 bg-gray-700 px-2 py-1 rounded">SUPABASE_ANON_KEY</code>
          <p className="text-xs text-gray-500 mt-1">This is the public "anon" key for your project.</p>
        </div>
      </div>
       <p className="text-gray-400 mt-6 text-sm">
        After adding the secrets, please refresh the page. The app will work locally without saving your data until this is configured.
      </p>
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
        const { odds, stake, outcome, isEachWay, placeFraction, manualProfitLoss } = bet;
        let profitLoss = 0;

        // Use manual override if provided
        if (typeof manualProfitLoss === 'number') {
            profitLoss = manualProfitLoss;
        } else {
            // Calculate automatically
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
      id: crypto.randomUUID(),
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
    if (!isSupabaseConfigured) {
      setToast({ id: Date.now(), message: 'Cannot save. Please configure Supabase credentials.', type: 'error' });
      return;
    }
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
      {!isSupabaseConfigured && <SupabaseSetupInstructions />}
      <Header 
        onAddBet={handleAddBet} 
        onSave={handleSave} 
        isSaving={isSaving}
        isSaveDisabled={!isSupabaseConfigured}
      />
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
