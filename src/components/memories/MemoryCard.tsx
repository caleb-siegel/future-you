import React from 'react';
import { Calendar, Tag, MapPin, Users, Edit3, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import type { Memory } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  onCreatePreference: (memory: Memory) => void;
  onViewDetails?: (memory: Memory) => void;
  supportingPreferenceCount?: number;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onEdit,
  onDelete,
  onCreatePreference,
  onViewDetails,
  supportingPreferenceCount = 0,
}) => {
  // Format creation date
  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all p-5 sm:p-6 flex flex-col justify-between group">
      <div>
        {/* Top metadata row: Category & Date */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {memory.category ? (
              <Badge variant="stone" size="sm">
                {memory.category}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Uncategorized
              </Badge>
            )}

            {supportingPreferenceCount > 0 && (
              <Badge variant="amber" size="sm">
                <Sparkles className="w-3 h-3 mr-0.5" />
                {supportingPreferenceCount} {supportingPreferenceCount === 1 ? 'preference' : 'preferences'}
              </Badge>
            )}
          </div>

          <div className="flex items-center text-xs text-stone-400 gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(memory.createdAt)}</span>
          </div>
        </div>

        {/* Content text */}
        <p
          onClick={() => onViewDetails?.(memory)}
          className={`text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
            onViewDetails ? 'cursor-pointer hover:text-stone-900' : ''
          }`}
        >
          {memory.content}
        </p>

        {/* Tags & Context */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          {memory.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100/70 px-2 py-0.5 rounded-md"
            >
              <Tag className="w-2.5 h-2.5 text-stone-400" />
              {tag}
            </span>
          ))}

          {memory.location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100/70 px-2 py-0.5 rounded-md">
              <MapPin className="w-2.5 h-2.5 text-stone-400" />
              {memory.location}
            </span>
          )}

          {memory.people && memory.people.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100/70 px-2 py-0.5 rounded-md">
              <Users className="w-2.5 h-2.5 text-stone-400" />
              {memory.people.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreatePreference(memory)}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
          className="text-xs"
        >
          Form preference
        </Button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(memory)}
            aria-label="Edit memory"
            title="Edit memory"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(memory)}
            aria-label="Delete memory"
            title="Delete memory"
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
