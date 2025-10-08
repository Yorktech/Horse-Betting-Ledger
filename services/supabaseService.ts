import { supabase } from './supabaseClient';
import type { Bet, BetData } from '../types';

const TABLE_NAME = 'bets';

/**
 * Converts DB representation (nulls) to app representation ('').
 */
const fromDb = (bet: any): Bet => ({
  ...bet,
  odds: bet.odds === null ? '' : bet.odds,
  stake: bet.stake === null ? '' : bet.stake,
  placeFraction: bet.placeFraction === null ? '' : bet.placeFraction,
});

/**
 * Converts app representation ('') to DB representation (nulls).
 * This ensures empty string inputs are stored as NULL in the database.
 */
const toDb = (bet: Bet) => ({
  ...bet,
  odds: bet.odds === '' ? null : bet.odds,
  stake: bet.stake === '' ? null : bet.stake,
  placeFraction: bet.placeFraction === '' ? null : bet.placeFraction,
});


/**
 * Fetches the spreadsheet data from Supabase.
 * @returns A promise that resolves to the grid data.
 */
export const fetchData = async (): Promise<{ data: BetData }> => {
  console.log('Fetching data from Supabase...');
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
  
  console.log('Data fetched successfully.');
  return { data: data.map(fromDb) };
};

/**
 * Saves the entire spreadsheet data by synchronizing it with the database.
 * Deletes bets not in the current state, and upserts the rest.
 * @param data The current grid data to save.
 * @returns A promise that resolves when the save is complete.
 */
export const saveData = async (data: BetData): Promise<void> => {
    console.log('Saving data to Supabase...', data);

    const dataToSave = data.map(toDb);

    // 1. Get all current bet IDs from the database
    const { data: dbBets, error: fetchError } = await supabase.from(TABLE_NAME).select('id');
    if (fetchError) {
        console.error('Error fetching existing IDs:', fetchError);
        throw fetchError;
    }
    
    // 2. Identify which bets to delete by comparing DB IDs with current app state IDs
    const currentIds = new Set(data.map(b => b.id));
    const dbIds = dbBets.map(b => b.id);
    const idsToDelete = dbIds.filter(id => !currentIds.has(id));

    // 3. Perform delete and upsert operations
    if (idsToDelete.length > 0) {
        console.log('Deleting bets:', idsToDelete);
        const { error: deleteError } = await supabase.from(TABLE_NAME).delete().in('id', idsToDelete);
        if (deleteError) {
            console.error('Error deleting bets:', deleteError);
            throw deleteError;
        }
    }

    if (dataToSave.length > 0) {
        console.log('Upserting bets:', dataToSave.length);
        const { error: upsertError } = await supabase.from(TABLE_NAME).upsert(dataToSave);
        if (upsertError) {
            console.error('Error upserting bets:', upsertError);
            throw upsertError;
        }
    }
    
    console.log('Data saved successfully to Supabase.');
};