import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bet } from '../types';
import { Outcome } from '../types';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

interface CalculatedBet extends Bet {
  profitLoss: number;
  runningProfitLoss: number;
}

interface BettingTableProps {
  bets: CalculatedBet[];
  onUpdateBet: (
    betId: string,
    field: keyof Omit<Bet, 'id'>,
    value: string | number | boolean
  ) => void;
  onDeleteBet: (betId: string) => void;
}

type SortKey =
  | 'bookie'
  | 'date'
  | 'horse'
  | 'trainer'
  | 'jockey'
  | 'odds'
  | 'stake'
  | 'isEachWay'
  | 'placeFraction'
  | 'outcome'
  | 'manualProfitLoss'
  | 'profitLoss'
  | 'runningProfitLoss';

type ColumnKey = SortKey | 'actions';

const numericSortKeys = new Set<SortKey>([
  'odds',
  'stake',
  'placeFraction',
  'manualProfitLoss',
  'profitLoss',
  'runningProfitLoss',
]);

const booleanSortKeys = new Set<SortKey>(['isEachWay']);

const searchableKeys: SortKey[] = [
  'bookie',
  'horse',
  'trainer',
  'jockey',
  'outcome',
  'date',
  'odds',
  'stake',
  'isEachWay',
  'manualProfitLoss',
  'profitLoss',
  'runningProfitLoss',
];

const outcomeOptions = Object.values(Outcome);
const numericFields: Array<keyof Omit<Bet, 'id'>> = [
  'odds',
  'stake',
  'placeFraction',
  'manualProfitLoss',
];

const PAGE_SIZE_OPTIONS = ['10', '25', '50'];
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

const columnDefinitions: Array<{
  key: ColumnKey;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}> = [
  { key: 'bookie', label: 'Bookie', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'horse', label: 'Horse', sortable: true },
  { key: 'trainer', label: 'Trainer', sortable: true },
  { key: 'jockey', label: 'Jockey', sortable: true },
  { key: 'odds', label: 'Odds', sortable: true, align: 'right' },
  { key: 'stake', label: 'Stake', sortable: true, align: 'right' },
  { key: 'isEachWay', label: 'E/W', sortable: true, align: 'center' },
  { key: 'placeFraction', label: 'Place Terms', sortable: true, align: 'center' },
  { key: 'outcome', label: 'Outcome', sortable: true },
  { key: 'manualProfitLoss', label: 'Manual P/L', sortable: true, align: 'right' },
  { key: 'profitLoss', label: 'Profit/Loss', sortable: true, align: 'right' },
  { key: 'runningProfitLoss', label: 'Running P/L', sortable: true, align: 'right' },
  { key: 'actions', label: 'Actions', align: 'center' },
];

const toNumericValue = (value: CalculatedBet[SortKey]): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toTimestamp = (value: CalculatedBet[SortKey]): number => {
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toComparableString = (value: CalculatedBet[SortKey]): string => {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  return String(value).toLowerCase();
};

const compareBets = (a: CalculatedBet, b: CalculatedBet, key: SortKey): number => {
  if (key === 'date') {
    return toTimestamp(a[key]) - toTimestamp(b[key]);
  }
  if (numericSortKeys.has(key)) {
    return toNumericValue(a[key]) - toNumericValue(b[key]);
  }
  if (booleanSortKeys.has(key)) {
    return Number(Boolean(a[key])) - Number(Boolean(b[key]));
  }
  return toComparableString(a[key]).localeCompare(toComparableString(b[key]));
};

const ProfitLossCell: React.FC<{ value: number }> = ({ value }) => {
  const tone =
    value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-muted-foreground';

  return (
    <TableCell className={cn('font-mono text-right', tone)}>
      {CURRENCY_FORMATTER.format(value)}
    </TableCell>
  );
};

const getPaginationItems = (current: number, total: number) => {
  if (total <= 1) {
    return [1];
  }

  const siblings = 1;
  const pages = new Set<number>();

  pages.add(1);
  pages.add(total);

  for (let i = current - siblings; i <= current + siblings; i += 1) {
    if (i > 1 && i < total) {
      pages.add(i);
    }
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);

  const items: Array<number | 'ellipsis'> = [];
  let lastPage = 0;

  sorted.forEach((page) => {
    if (lastPage && page - lastPage > 1) {
      items.push('ellipsis');
    }
    items.push(page);
    lastPage = page;
  });

  return items;
};

export const BettingTable: React.FC<BettingTableProps> = ({
  bets,
  onUpdateBet,
  onDeleteBet,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const filteredBets = React.useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) {
      return bets;
    }
    return bets.filter((bet) =>
      searchableKeys.some((key) => toComparableString(bet[key]).includes(trimmedQuery))
    );
  }, [bets, searchQuery]);

  const sortedBets = React.useMemo(() => {
    if (!sortConfig) {
      return filteredBets;
    }
    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;
    return [...filteredBets].sort((a, b) => compareBets(a, b, key) * multiplier);
  }, [filteredBets, sortConfig]);

  const numericPageSize = Number(pageSize);
  const pageCount = React.useMemo(
    () => Math.max(1, Math.ceil(sortedBets.length / numericPageSize)),
    [sortedBets.length, numericPageSize]
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  React.useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const paginatedBets = React.useMemo(() => {
    const start = (currentPage - 1) * numericPageSize;
    return sortedBets.slice(start, start + numericPageSize);
  }, [sortedBets, currentPage, numericPageSize]);

  const displayedBets = paginatedBets;

  const handleFieldChange = (
    betId: string,
    field: keyof Omit<Bet, 'id'>,
    value: string | number | boolean
  ) => {
    if (numericFields.includes(field)) {
      if (value === '') {
        onUpdateBet(betId, field, '');
        return;
      }
      const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
      onUpdateBet(
        betId,
        field,
        Number.isFinite(numericValue) ? numericValue : ''
      );
      return;
    }
    onUpdateBet(betId, field, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search bets..."
            className="w-full sm:w-64"
            aria-label="Search bets"
          />
          <Select
            value={pageSize}
            onValueChange={(value) => setPageSize(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sortConfig && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start lg:self-auto"
            onClick={() => setSortConfig(null)}
          >
            Clear sorting
          </Button>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                {columnDefinitions.map((column) => {
                  const isActiveSort = sortConfig?.key === column.key;
                  const direction = sortConfig?.direction ?? 'asc';
                  const ariaSort = column.sortable
                    ? isActiveSort
                      ? direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    : undefined;

                  return (
                    <TableHead
                      key={column.label}
                      aria-sort={ariaSort}
                      className={cn(
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        'whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground'
                      )}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column.key as SortKey)}
                          className="flex items-center gap-1"
                        >
                          <span>{column.label}</span>
                          {isActiveSort ? (
                            direction === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedBets.map((bet) => (
                <TableRow key={bet.id} className="text-sm">
                  <TableCell className="align-middle">
                    <Input
                      type="text"
                      value={bet.bookie ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'bookie', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <Input
                      type="date"
                      value={bet.date ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'date', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <Input
                      type="text"
                      value={bet.horse ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'horse', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <Input
                      type="text"
                      value={bet.trainer ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'trainer', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <Input
                      type="text"
                      value={bet.jockey ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'jockey', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="align-middle text-right">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={bet.odds ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'odds', event.target.value)
                      }
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="align-middle text-right">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={bet.stake ?? ''}
                      onChange={(event) =>
                        handleFieldChange(bet.id, 'stake', event.target.value)
                      }
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="align-middle text-center">
                    <Checkbox
                      checked={Boolean(bet.isEachWay)}
                      onCheckedChange={(checked) =>
                        handleFieldChange(bet.id, 'isEachWay', checked === true)
                      }
                      aria-label="Each way bet"
                      className="mx-auto"
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    {bet.isEachWay ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">1/</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={bet.placeFraction ?? ''}
                          onChange={(event) =>
                            handleFieldChange(
                              bet.id,
                              'placeFraction',
                              event.target.value
                            )
                          }
                          className="text-right"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="align-middle">
                    <Select
                      value={bet.outcome}
                      onValueChange={(value) =>
                        handleFieldChange(bet.id, 'outcome', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        {outcomeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="align-middle text-right">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={bet.manualProfitLoss ?? ''}
                      onChange={(event) =>
                        handleFieldChange(
                          bet.id,
                          'manualProfitLoss',
                          event.target.value
                        )
                      }
                      placeholder="Auto"
                      className="text-right font-mono"
                    />
                  </TableCell>
                  <ProfitLossCell value={bet.profitLoss} />
                  <ProfitLossCell value={bet.runningProfitLoss} />
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteBet(bet.id)}
                      aria-label={`Delete bet on ${bet.horse || 'horse'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {displayedBets.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columnDefinitions.length}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {bets.length === 0
                      ? 'No bets found. Click "+ Add Bet" to get started.'
                      : 'No bets match your filters.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {sortedBets.length > 0 && (
          <div className="border-t border-border bg-muted/30 p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={cn(currentPage === 1 && 'pointer-events-none opacity-50')}
                  />
                </PaginationItem>
                {getPaginationItems(currentPage, pageCount).map((item, index) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === item}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.min(pageCount, prev + 1));
                    }}
                    className={cn(
                      currentPage === pageCount && 'pointer-events-none opacity-50'
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};
