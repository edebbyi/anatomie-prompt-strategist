import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'filled' | 'ghost' | 'danger';
  children: ReactNode;
}

export function Button({ 
  variant = 'outline', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-5 py-2.5 rounded-lg transition-all duration-200 shadow-sm';
  
  const variantClasses = {
    primary: 'bg-white border border-[#525866] text-[#525866] hover:bg-[#525866] hover:text-white shadow-md',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md',
    filled: 'bg-[#525866] text-white hover:bg-[#3d424d] shadow-md',
    ghost: 'bg-transparent border border-transparent text-gray-600 hover:bg-gray-100',
    danger: 'bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-md',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}