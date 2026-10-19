import React, { useState, useEffect } from 'react';
import type { Preference, PreferenceImportance } from '../../types';
import { CATEGORIES } from '../../types';
import { getPreferences } from '../../services/preferences';
import { addPreferenceToPlan } from '../../services/planItems';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImportanceBadge, Badge } from '../ui/Badge';
import { Search, Check, AlertCircle, Plus } from 'lucide-react';

interface AddPreferencesToPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  existingPreferenceIds: string[];
  onSuccess: () => void;
}

export const AddPreferencesToPlanModal: React.FC<AddPreferencesToPlanModalProps> = ({
  isOpen,
  onClose,
  planId,
  existingPreferenceIds,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [allPreferences, setAllPreferences] = useState<Preference[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      setSelectedIds([]);
      setSearchTerm('');
      setSelectedCategory('all');
      setError(null);

      getPreferences(user.uid, { status: 'active' })
        .then((prefs) => {
          setAllPreferences(prefs);
        })
        .catch((err) => {
          console.error('Failed to load preferences:', err);
          setError('Failed to load existing preferences.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user]);

  const toggleSelection = (prefId: string) => {
    if (selectedIds.includes(prefId)) {
      setSelectedIds(selectedIds.filter((id) => id !== prefId));
    } else {
      setSelectedIds([...selectedIds, prefId]);
    }
  };

  const filteredPreferences = allPreferences.filter((p) => {
    // Exclude ones already in plan
    if (existingPreferenceIds.includes(p.id)) return false;

    // Category filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchDesc = p.description.toLowerCase().includes(term);
      const matchCat = p.category.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchCat;
    }

    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      for (const prefId of selectedIds) {
        const pref = allPreferences.find((p) => p.id === prefId);
        await addPreferenceToPlan({
          userId: user.uid,
          planId,
          preferenceId: prefId,
          importance: pref?.importance || 'medium',
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add preferences to plan:', err);
      setError(err?.message || 'Failed to add preferences to plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Preferences to Plan"
      description="Select one or more existing preferences to apply to this plan."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search preferences..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Preferences List */}
        <div className="max-h-64 overflow-y-auto border border-stone-200 rounded-xl p-2 bg-stone-50/50 space-y-2">
          {isLoading ? (
            <p className="text-xs text-stone-400 p-4 text-center">Loading preferences...</p>
          ) : filteredPreferences.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs font-medium text-stone-600 mb-1">
                {allPreferences.length === 0
                  ? 'No active preferences found.'
                  : 'All matching preferences have already been added to this plan.'}
              </p>
              <p className="text-[11px] text-stone-400">
                You can create new preferences from memories or the Preferences tab.
              </p>
            </div>
          ) : (
            filteredPreferences.map((pref) => {
              const isSelected = selectedIds.includes(pref.id);
              return (
                <div
                  key={pref.id}
                  onClick={() => toggleSelection(pref.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="stone" size="sm">
                        {pref.category}
                      </Badge>
                      <ImportanceBadge importance={pref.importance} size="sm" />
                    </div>
                    <h5 className="text-sm font-semibold text-stone-900">{pref.title}</h5>
                    {pref.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {pref.description}
                      </p>
                    )}
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border mt-1 transition-colors ${
                      isSelected
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-stone-200/80">
          <span className="text-xs text-stone-500">
            {selectedIds.length} {selectedIds.length === 1 ? 'preference' : 'preferences'} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={selectedIds.length === 0 || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Selected
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
