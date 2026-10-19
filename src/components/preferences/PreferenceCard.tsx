import React from 'react';
import { Sparkles, Edit3, Trash2, Archive, ArchiveRestore, BookOpen, Compass } from 'lucide-react';
import type { Preference } from '../../types';
import { ImportanceBadge, StatusBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PreferenceCardProps {
  preference: Preference;
  onEdit: (preference: Preference) => void;
  onDelete: (preference: Preference) => void;
  onToggleArchive: (preference: Preference) => void;
  onAddToPlan?: (preference: Preference) => void;
  onViewDetails?: (preference: Preference) => void;
}

export const PreferenceCard: React.FC<PreferenceCardProps> = ({
  preference,
  onEdit,
  onDelete,
  onToggleArchive,
  onAddToPlan,
  onViewDetails,
}) => {
  const isArchived = preference.status === 'archived';

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all p-5 sm:p-6 flex flex-col justify-between group ${
        isArchived ? 'opacity-70 bg-stone-50/50' : ''
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="stone" size="sm">
              {preference.category}
            </Badge>
            <ImportanceBadge importance={preference.importance} size="sm" />
            {preference.status !== 'active' && (
              <StatusBadge status={preference.status} size="sm" />
            )}
          </div>

          {/* Supporting memories count */}
          <div
            onClick={() => onViewDetails?.(preference)}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-400" />
            <span>
              {preference.supportingMemoryIds?.length || 0}{' '}
              {preference.supportingMemoryIds?.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4
          onClick={() => onViewDetails?.(preference)}
          className={`text-base font-semibold text-stone-900 mb-1.5 ${
            onViewDetails ? 'cursor-pointer hover:text-stone-700' : ''
          }`}
        >
          {preference.title}
        </h4>

        {/* Description */}
        {preference.description && (
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
            {preference.description}
          </p>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {onAddToPlan && !isArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddToPlan(preference)}
              leftIcon={<Compass className="w-3.5 h-3.5 text-stone-600" />}
              className="text-xs"
            >
              Add to plan
            </Button>
          )}

          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(preference)}
              className="text-xs text-stone-500"
            >
              Details
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleArchive(preference)}
            aria-label={isArchived ? 'Reactivate preference' : 'Archive preference'}
            title={isArchived ? 'Reactivate preference' : 'Archive preference'}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            {isArchived ? (
              <ArchiveRestore className="w-4 h-4 text-emerald-600" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(preference)}
            aria-label="Edit preference"
            title="Edit preference"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(preference)}
            aria-label="Delete preference"
            title="Delete preference"
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
