
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark';
  
  const variantClasses = {
    primary: 'bg-brand-primary hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
      {...props}
    >
      {children}
    </button>
  );
};
