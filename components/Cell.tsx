
import React, { useState, useEffect } from 'react';

interface CellProps {
  value: string | number;
  onUpdate: (newValue: string | number) => void;
  isHeader?: boolean;
}

export const Cell: React.FC<CellProps> = ({ value, onUpdate, isHeader = false }) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);
  
  const handleBlur = () => {
    if (currentValue !== value) {
      onUpdate(currentValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  if (isHeader) {
      return (
        <th className="sticky top-0 bg-gray-800 p-2 border-r border-b border-gray-700 text-left font-semibold text-gray-300 whitespace-nowrap">
            {value}
        </th>
      )
  }

  return (
    <td className="p-0 border-r border-b border-gray-700">
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-full h-full p-2 bg-transparent text-gray-200 focus:bg-gray-700 focus:outline-none"
      />
    </td>
  );
};
