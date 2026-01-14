import { Bet, BetType, Outcome, Selection } from '../types';

export const parseBet365Text = (text: string): Bet[] => {
  // Split by date pattern: dd/mm/yyyy hh:mm:ss
  const dateRegex = /\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}/g;
  const blocks: string[] = [];
  let match;
  let lastIndex = 0;

  while ((match = dateRegex.exec(text)) !== null) {
    if (lastIndex !== match.index) {
      const content = text.substring(lastIndex, match.index).trim();
      if (content) blocks.push(content);
    }
    lastIndex = match.index;
  }
  blocks.push(text.substring(lastIndex).trim());

  // The first block might be empty if text starts with a date
  const betBlocks = blocks.filter(b => dateRegex.test(b));

  return betBlocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const dateLine = lines[0];
    const dateMatch = dateLine.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const isoDate = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : new Date().toISOString().split('T')[0];

    const isLucky15 = block.toLowerCase().includes('lucky 15');
    
    if (isLucky15) {
      return parseLucky15(lines, isoDate);
    } else {
      return parseSingle(lines, isoDate);
    }
  });
};

function parseSingle(lines: string[], date: string): Bet {
  // Typical Single Block:
  // 0: 14/01/2026 11:29:55
  // 1: Rogue Rebellion 6.50 (sometimes split)
  // ...
  // N: E/W £0.50 Single
  // N+1: Stake £1.00
  // N+2: Return £4.44
  
  let horse = '';
  let odds: number | '' = '';
  let stake: number | '' = '';
  let isEachWay = false;
  let returnVal = 0;
  let hasBetCredits = false;

  // Search for terms and stake
  lines.forEach((line, i) => {
    if (line.includes('Single')) {
      isEachWay = line.toLowerCase().includes('e/w');
    }
    if (line.startsWith('Stake £')) {
      stake = parseFloat(line.replace('Stake £', '').replace(',', ''));
    }
    if (line.startsWith('Return £')) {
      returnVal = parseFloat(line.replace('Return £', '').replace(',', ''));
    }
    if (line.includes('Bet Credits')) {
      hasBetCredits = true;
    }
  });

  // Horse name and odds usually line 1 or 2
  const fullText = blockToString(lines);
  const cleanLine = (l: string) => l.replace(/B\.O\.G|ODDS INCREASED|Cash Out|Edit Bet/gi, '').trim();

  const oddsMatch = fullText.match(/(\d+\.\d{2})/); // Look for decimal odds
  if (oddsMatch) {
    odds = parseFloat(oddsMatch[1]);
    
    // Try to extract horse name: it's usually between the date and the odds
    // We'll look at the lines before the odds
    const oddsIndex = lines.findIndex(l => l.includes(oddsMatch[1]));
    if (oddsIndex > 0) {
        horse = cleanLine(lines[oddsIndex].replace(oddsMatch[1], '').trim());
        if (!horse && oddsIndex > 1) {
            horse = cleanLine(lines[oddsIndex - 1]);
        }
    }
  }

  // Fallback for horse name
  if (!horse && lines[1]) {
      horse = cleanLine(lines[1]);
  }

  // Determine outcome
  let outcome = Outcome.LOST;
  if (returnVal > 0) {
    // Logic for Won vs Placed depends on return vs expected return
    // For now, if return > (stake * 1.1) we call it a win, otherwise maybe a place if EW
    // Simplification:
    outcome = returnVal > 0 ? Outcome.WON : Outcome.LOST;
    // Better: If Return > 0 but less than (Stake * Odds), and it's Each Way, it's likely a PLACED
    if (isEachWay && typeof stake === 'number' && typeof odds === 'number') {
        const fullWinReturn = (stake/2 * odds) + (stake/2); // Very rough
        if (returnVal < fullWinReturn * 0.8) {
            outcome = Outcome.PLACED;
        }
      }
  }

  // Handle Bet Credits (Free Bets)
  // If it was a free bet, the stake is not deducted from balance.
  // Net profit is the Return.
  let manualProfitLoss: number | undefined = undefined;
  if (hasBetCredits) {
      manualProfitLoss = returnVal; // For free bets, profit = total return
  }

  return {
    id: crypto.randomUUID(),
    type: BetType.SINGLE,
    bookie: 'Bet365',
    date,
    horse,
    trainer: '',
    jockey: '',
    odds,
    stake: isEachWay && typeof stake === 'number' ? stake / 2 : stake, // Unit stake
    outcome,
    isEachWay,
    placeFraction: 5, // Default
    manualProfitLoss
  };
}

function parseLucky15(lines: string[], date: string): Bet {
  const selections: Selection[] = [];
  let stake: number | '' = '';
  let isEachWay = false;
  let returnVal = 0;

  // Find Lucky 15 line: "E/W Lucky 15, 15 bets * £0.10"
  lines.forEach(line => {
    if (line.toLowerCase().includes('lucky 15')) {
      isEachWay = line.toLowerCase().includes('e/w');
    }
    if (line.startsWith('Stake £')) {
      stake = parseFloat(line.replace('Stake £', '').replace(',', ''));
    }
    if (line.startsWith('Return £')) {
      returnVal = parseFloat(line.replace('Return £', '').replace(',', ''));
    }
  });

  // Extract horses - usually lines between date and "Lucky 15"
  // Headshot 9.50
  lines.forEach(line => {
    const match = line.match(/(.*?)\s+(\d+\.\d{2})$/);
    if (match && !line.includes('Return') && !line.includes('Stake')) {
        selections.push({
            id: crypto.randomUUID(),
            horse: match[1].trim(),
            odds: parseFloat(match[2]),
            outcome: returnVal > 0 ? Outcome.WON : Outcome.LOST, // Placeholder, usually manual adjustment needed
            placeFraction: 5
        });
    }
  });

  return {
    id: crypto.randomUUID(),
    type: BetType.LUCKY_15,
    bookie: 'Bet365',
    date,
    horse: 'Lucky 15',
    trainer: '',
    jockey: '',
    odds: '',
    stake: typeof stake === 'number' ? (isEachWay ? stake / 30 : stake / 15) : '',
    outcome: Outcome.PENDING, // Summary outcome
    isEachWay,
    placeFraction: '',
    selections: selections.length === 4 ? selections : undefined,
    manualProfitLoss: undefined // Calculated usually
  };
}

function blockToString(lines: string[]): string {
    return lines.join(' ');
}

