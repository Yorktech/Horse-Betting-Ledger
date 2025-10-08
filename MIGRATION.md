# Database Migration Instructions

## Adding the Manual Profit/Loss Column

To support manual profit/loss overrides (for free bets, odds boosts, etc.), you need to add a new column to your Supabase database.

### Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project: `dxdkmokqeweqfwknyhla`

2. **Open the SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the contents of `supabase-migration.sql`
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify the Column Was Added**
   - Go to "Table Editor" in the left sidebar
   - Select the `bets` table
   - You should see a new column called `manualProfitLoss` of type `NUMERIC`

### Alternative: Run via SQL Command

```sql
ALTER TABLE bets 
ADD COLUMN IF NOT EXISTS "manualProfitLoss" NUMERIC;

COMMENT ON COLUMN bets."manualProfitLoss" IS 'Manual override for profit/loss calculation (for free bets, odds boosts, etc.)';
```

### What This Does:

- Adds a new nullable column `manualProfitLoss` to the `bets` table
- Allows you to manually override the calculated profit/loss for special bets
- When left empty, the app will auto-calculate profit/loss based on odds and outcome
- When filled in, the app will use your manual value instead

### Using the Feature:

1. In the betting ledger, you'll see a new "Manual P/L" column (shown in yellow)
2. Leave it blank for normal auto-calculation
3. Enter a specific amount for free bets, odds boosts, or other special scenarios
4. The "Profit/Loss" and "Running P/L" columns will reflect your manual entry
