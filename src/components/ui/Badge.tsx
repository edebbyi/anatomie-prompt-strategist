import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'renderer' | 'success' | 'warning' | 'default' | 'declined';
  children: ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variantClasses = {
    renderer: 'bg-[#525866] text-white',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    declined: 'bg-red-100 text-red-800 border border-red-200',
  };

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}