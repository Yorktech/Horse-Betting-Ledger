import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { BettingTable } from './components/Grid';
import { StatsPanel } from './components/StatsPanel';
import { Toast } from './components/Toast';
import { Lucky15Modal } from './components/Lucky15Modal';
import { fetchData, saveData } from './services/supabaseService';
import { isSupabaseConfigured } from './services/supabaseClient';
import type { Bet, ToastMessage, Selection } from './types';
import { Outcome, BetType } from './types';

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

// Helper to generate combinations
function getCombinations<T>(arr: T[], k: number): T[][] {
  const results: T[][] = [];
  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return results;
}

const App: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [startBank, setStartBank] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Lucky 15 Modal State
  const [isLucky15ModalOpen, setIsLucky15ModalOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | undefined>(undefined);

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
      let profitLoss = 0;

      if (bet.type === BetType.LUCKY_15 && bet.selections) {
        // LUCKY 15 CALCULATION
        const unitStake = typeof bet.stake === 'number' ? bet.stake : 0;
        if (unitStake > 0) {
          const selections = bet.selections;
          // 4 Singles, 6 Doubles, 4 Trebles, 1 Four-fold
          const combinations: Selection[][] = [
            ...getCombinations<Selection>(selections, 1),
            ...getCombinations<Selection>(selections, 2),
            ...getCombinations<Selection>(selections, 3),
            ...getCombinations<Selection>(selections, 4),
          ];

          let totalReturn = 0;
          const totalStake = unitStake * (bet.isEachWay ? 30 : 15);

          combinations.forEach(combo => {
            // Win Part
            let winMultiplier = 1;
            let winVoid = false;
            let winLost = false;

            // Place Part
            let placeMultiplier = 1;
            let placeVoid = false;
            let placeLost = false;

            combo.forEach(sel => {
              // Win Logic
              if (sel.outcome === Outcome.LOST || sel.outcome === Outcome.PLACED) winLost = true;
              if (sel.outcome === Outcome.VOID) winVoid = true; // Treated as non-runner (odds 1.0)
              if (sel.outcome === Outcome.PENDING) winLost = true; // Treat as lost until settled? Or ignore? 
              // For PENDING, we should probably return 0 profit for the whole bet or handle it gracefully.
              // Here we assume PENDING means no return yet.

              const odds = typeof sel.odds === 'number' ? sel.odds : 0;
              if (!winLost && !winVoid) {
                winMultiplier *= (odds + 1); // Decimal odds for return
              }

              // Place Logic
              if (bet.isEachWay) {
                if (sel.outcome === Outcome.LOST) placeLost = true;
                if (sel.outcome === Outcome.VOID) placeVoid = true;
                if (sel.outcome === Outcome.PENDING) placeLost = true;

                const placeFraction = typeof sel.placeFraction === 'number' ? sel.placeFraction : 0;
                if (!placeLost && !placeVoid && placeFraction > 0) {
                  placeMultiplier *= ((odds / placeFraction) + 1);
                }
              }
            });

            if (!winLost) {
              totalReturn += unitStake * winMultiplier;
            }
            if (bet.isEachWay && !placeLost) {
              totalReturn += unitStake * placeMultiplier;
            }
          });

          // Check if any selection is pending, if so, maybe show 0 or partial?
          // For now, if any is pending, the whole bet P/L might be inaccurate, but let's calculate what we can.
          // Actually, if outcome is PENDING, we treated it as lost above.
          // Let's check if ALL are settled.
          const anyPending = selections.some(s => s.outcome === Outcome.PENDING);
          if (anyPending) {
            // If we want to show potential returns, that's different. 
            // For ledger, usually we show 0 or negative stake until settled.
            // Let's default to -TotalStake if pending, or 0? 
            // Existing logic for single bets: PENDING -> 0 P/L.
            profitLoss = 0;
          } else {
            profitLoss = totalReturn - totalStake;
          }
        }
      } else {
        // SINGLE BET CALCULATION (Existing Logic)
        const { odds, stake, outcome, isEachWay, placeFraction, manualProfitLoss } = bet;

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
      }

      runningTotal += profitLoss;
      return { ...bet, profitLoss, runningProfitLoss: runningTotal };
    });
  }, [bets]);

  const stats = useMemo(() => {
    const runningProfitLoss = calculatedBets[calculatedBets.length - 1]?.runningProfitLoss || 0;
    // For Lucky 15, "wins" is ambiguous. We'll count it as a win if P/L > 0? 
    // Or just count individual bets? 
    // Existing logic: wins: bets.filter(b => b.outcome === Outcome.WON).length
    // For Lucky 15, outcome is PENDING until all settled. We should probably set a summary outcome.
    // Let's stick to simple counting for now.
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

  const handleAddSingle = () => {
    const newBet: Bet = {
      id: crypto.randomUUID(),
      type: BetType.SINGLE,
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

  const handleAddLucky15 = () => {
    setEditingBet(undefined);
    setIsLucky15ModalOpen(true);
  };

  const handleSaveLucky15 = (bet: Bet) => {
    if (editingBet) {
      setBets(prev => prev.map(b => b.id === bet.id ? bet : b));
    } else {
      setBets(prev => [...prev, bet]);
    }
  };

  const handleDeleteBet = (betId: string) => {
    setBets(prevBets => prevBets.filter(bet => bet.id !== betId));
  };

  const handleEditBet = (bet: Bet) => {
    if (bet.type === BetType.LUCKY_15) {
      setEditingBet(bet);
      setIsLucky15ModalOpen(true);
    }
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
        onAddBet={handleAddSingle}
        onAddLucky15={handleAddLucky15}
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
                onEditBet={handleEditBet}
              />
            )}
          </div>
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <StatsPanel stats={stats} onStartBankChange={setStartBank} />
          </div>
        </div>
      </main>
      <Lucky15Modal
        isOpen={isLucky15ModalOpen}
        onClose={() => setIsLucky15ModalOpen(false)}
        onSave={handleSaveLucky15}
        initialBet={editingBet}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
