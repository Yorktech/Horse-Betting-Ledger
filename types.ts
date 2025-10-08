export enum Outcome {
  WON = 'Won',
  PLACED = 'Placed',
  LOST = 'Lost',
  VOID = 'Void',
  PENDING = 'Pending',
}

export interface Bet {
  id: string;
  bookie: string;
  date: string; // YYYY-MM-DD for date input
  odds: number | '';
  stake: number | '';
  outcome: Outcome;
  horse: string;
  trainer: string;
  jockey: string;
  isEachWay: boolean;
  placeFraction: number | '';
  manualProfitLoss?: number | ''; // Manual override for free bets, odds boosts, etc.
}

export type BetData = Bet[];

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}