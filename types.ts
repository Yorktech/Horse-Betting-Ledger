export enum Outcome {
  WON = 'Won',
  PLACED = 'Placed',
  LOST = 'Lost',
  VOID = 'Void',
  PENDING = 'Pending',
}

export enum BetType {
  SINGLE = 'Single',
  LUCKY_15 = 'Lucky 15',
}

export interface Selection {
  id: string;
  horse: string;
  outcome: Outcome;
  odds: number | '';
  placeFraction: number | ''; // For E/W
  rule4?: number; // Deduction
}

export interface Bet {
  id: string;
  type?: BetType;
  bookie: string;
  date: string; // YYYY-MM-DD for date input
  odds: number | ''; // For Single bets
  stake: number | ''; // Unit stake
  outcome: Outcome; // For Single bets
  horse: string; // For Single bets (or summary for multiples)
  trainer: string;
  jockey: string;
  isEachWay: boolean;
  placeFraction: number | ''; // For Single bets
  manualProfitLoss?: number | ''; // Manual override for free bets, odds boosts, etc.
  selections?: Selection[]; // For Lucky 15, etc.
}

export type BetData = Bet[];

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}