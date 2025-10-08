import React from 'react';
import { Button } from './Button';

interface HeaderProps {
  onAddBet: () => void;
  onSave: () => void;
  isSaving: boolean;
}

const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ onAddBet, onSave, isSaving }) => {
  return (
    <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-700">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-light">
          Betting Ledger
        </h1>
        <div className="flex items-center space-x-4">
          <Button onClick={onAddBet} variant="secondary" disabled={isSaving}>
            + Add Bet
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
                <>
                    <SpinnerIcon />
                    Saving...
                </>
            ) : (
                'Save Ledger'
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
