import type { Bet, BetData } from '../types';
import { Outcome } from '../types';

// --- MOCK DATA ---
const createInitialData = (): BetData => {
  return [
    { id: 'bet-1', bookie: '365', date: '2024-02-23', odds: 8, stake: 2.00, outcome: Outcome.WON, horse: 'Northcliff', trainer: 'Mike Murphy & Michael Keady', jockey: 'Harry Davies', isEachWay: true, placeFraction: 5 },
    { id: 'bet-2', bookie: '365', date: '2024-02-23', odds: 26, stake: 2.00, outcome: Outcome.PLACED, horse: 'One Last Hug', trainer: 'Jim Goldie', jockey: 'Jim Goldie', isEachWay: true, placeFraction: 5 },
    { id: 'bet-3', bookie: '365', date: '2024-02-24', odds: 13, stake: 2.00, outcome: Outcome.LOST, horse: 'Cobh Harour', trainer: 'Mark Loughnane', jockey: 'Mark Loughnane', isEachWay: false, placeFraction: '' },
    { id: 'bet-4', bookie: '365', date: '2024-02-24', odds: 13, stake: 2.00, outcome: Outcome.PLACED, horse: 'Solly Attwell', trainer: 'Cian Collins', jockey: 'SW Flanagan', isEachWay: true, placeFraction: 4 },
    { id: 'bet-5', bookie: '365', date: '2024-02-26', odds: 8, stake: 2.00, outcome: Outcome.PLACED, horse: 'Bedford Flyer', trainer: 'Michael Appleby', jockey: 'Hollie Doyle', isEachWay: true, placeFraction: 5 },
  ];
};


let MOCK_DB: BetData = createInitialData();

/**
 * Fetches the spreadsheet data.
 * @returns A promise that resolves to the grid data.
 */
export const fetchData = async (): Promise<{ data: BetData }> => {
  console.log('Fetching data...');
  
  // MOCK IMPLEMENTATION
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  
  return { data: MOCK_DB };
};

/**
 * Saves the entire spreadsheet data.
 * @param data The current grid data to save.
 * @returns A promise that resolves when the save is complete.
 */
export const saveData = async (data: BetData): Promise<void> => {
    console.log('Saving data...', data);

    // MOCK IMPLEMENTATION
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    MOCK_DB = JSON.parse(JSON.stringify(data)); // Deep copy to simulate saving
    
    console.log('Data saved successfully.');
};