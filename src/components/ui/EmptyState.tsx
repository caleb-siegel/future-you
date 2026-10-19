import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-stone-200/90 bg-stone-50/50 ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-center text-stone-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
