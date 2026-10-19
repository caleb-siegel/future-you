import React from 'react';
import type { PreferenceImportance, PreferenceStatus, PlanStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'stone' | 'amber' | 'emerald' | 'rose' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded-md',
    md: 'text-xs font-medium px-2.5 py-1 rounded-lg',
  };

  const variantClasses = {
    neutral: 'bg-stone-100 text-stone-700 border border-stone-200/80',
    stone: 'bg-stone-200/60 text-stone-800 border border-stone-300/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200',
    blue: 'bg-sky-50 text-sky-800 border border-sky-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const ImportanceBadge: React.FC<{
  importance: PreferenceImportance;
  size?: 'sm' | 'md';
}> = ({ importance, size = 'sm' }) => {
  switch (importance) {
    case 'must_have':
      return (
        <Badge variant="rose" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-0.5" />
          Must Have
        </Badge>
      );
    case 'high':
      return (
        <Badge variant="amber" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />
          High
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="blue" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-0.5" />
          Medium
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="neutral" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mr-0.5" />
          Low
        </Badge>
      );
    default:
      return <Badge size={size}>{importance}</Badge>;
  }
};

export const StatusBadge: React.FC<{
  status: PreferenceStatus | PlanStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'active':
      return (
        <Badge variant="emerald" size={size}>
          Active
        </Badge>
      );
    case 'reconsider':
      return (
        <Badge variant="amber" size={size}>
          Reconsider
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="emerald" size={size}>
          Completed
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="neutral" size={size}>
          Archived
        </Badge>
      );
    default:
      return <Badge size={size}>{status}</Badge>;
  }
};
