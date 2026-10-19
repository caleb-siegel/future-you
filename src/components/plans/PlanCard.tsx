import React from 'react';
import { Compass, Edit3, Trash2, CheckCircle2, Archive, ArchiveRestore } from 'lucide-react';
import type { Plan } from '../../types';
import { StatusBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PlanCardProps {
  plan: Plan;
  itemCount?: number;
  completedItemCount?: number;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  onViewDetails: (plan: Plan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  itemCount = 0,
  completedItemCount = 0,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}) => {
  const isCompleted = plan.status === 'completed';
  const isArchived = plan.status === 'archived';

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all p-5 sm:p-6 flex flex-col justify-between group ${
        isCompleted || isArchived ? 'opacity-75 bg-stone-50/50' : ''
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="stone" size="sm">
              {plan.category}
            </Badge>
            <StatusBadge status={plan.status} size="sm" />
          </div>

          <span className="text-xs text-stone-500 font-medium">
            {itemCount} {itemCount === 1 ? 'preference' : 'preferences'}
          </span>
        </div>

        {/* Title */}
        <h4
          onClick={() => onViewDetails(plan)}
          className="text-base font-semibold text-stone-900 mb-1.5 cursor-pointer hover:text-stone-700 transition-colors"
        >
          {plan.title}
        </h4>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-3 mb-4">
            {plan.description}
          </p>
        )}

        {/* Checklist Progress if items exist */}
        {itemCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>Progress</span>
              <span>
                {completedItemCount} / {itemCount} checked
              </span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${itemCount > 0 ? (completedItemCount / itemCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewDetails(plan)}
          className="text-xs"
        >
          Open Plan
        </Button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleStatus(plan)}
            aria-label={isCompleted ? 'Mark active' : 'Mark completed'}
            title={isCompleted ? 'Mark active' : 'Mark completed'}
            className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2
              className={`w-4 h-4 ${isCompleted ? 'text-emerald-600 fill-emerald-100' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => onEdit(plan)}
            aria-label="Edit plan"
            title="Edit plan"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(plan)}
            aria-label="Delete plan"
            title="Delete plan"
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
