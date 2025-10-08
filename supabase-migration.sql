-- Migration script to add manualProfitLoss column to the bets table
-- Run this in your Supabase SQL Editor

-- Add the new column to allow manual profit/loss overrides
ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS "manualProfitLoss" NUMERIC;

-- Add a comment to describe the column
COMMENT ON COLUMN bets."manualProfitLoss" IS 'Manual override for profit/loss calculation (for free bets, odds boosts, etc.)';

-- Optional: Create an index if you plan to query based on manual overrides
-- CREATE INDEX IF NOT EXISTS idx_bets_manual_profit_loss ON bets("manualProfitLoss");
