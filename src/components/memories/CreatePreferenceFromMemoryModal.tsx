import React, { useState, useEffect } from 'react';
import type { Category, Memory, PreferenceImportance } from '../../types';
import { CATEGORIES } from '../../types';
import { createPreference } from '../../services/preferences';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Sparkles, AlertCircle, Quote } from 'lucide-react';

interface CreatePreferenceFromMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onSuccess: (preferenceId: string) => void;
}

export const CreatePreferenceFromMemoryModal: React.FC<CreatePreferenceFromMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Home');
  const [importance, setImportance] = useState<PreferenceImportance>('high');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memory) {
      setTitle('');
      setDescription('');
      if (memory.category && CATEGORIES.includes(memory.category as Category)) {
        setCategory(memory.category as Category);
      } else {
        setCategory('Home');
      }
      setImportance('high');
      setError(null);
    }
  }, [memory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a title for this preference.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prefId = await createPreference({
        userId: memory.userId,
        title: trimmedTitle,
        description: description.trim(),
        category,
        importance,
        status: 'active',
        supportingMemoryIds: [memory.id],
      });

      onSuccess(prefId);
      onClose();
    } catch (err: any) {
      console.error('Failed to create preference:', err);
      setError(err?.message || 'Failed to create preference.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Preference from Memory"
      description="Translate your experience into a lasting principle for future decisions."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supporting Memory Preview */}
        {memory && (
          <div className="p-3.5 bg-stone-100/70 border border-stone-200/90 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Quote className="w-3 h-3 text-stone-400" />
              Supporting Memory
            </span>
            <p className="text-xs text-stone-700 italic leading-relaxed line-clamp-3">
              "{memory.content}"
            </p>
          </div>
        )}

        {/* Preference Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Preference Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. At least two bathrooms"
            className="w-full px-3.5 py-2 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Description & Rationale
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Sharing one bathroom creates friction during trips. Prioritize accommodations and homes with multiple bathrooms."
            className="w-full px-3.5 py-2 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none resize-none"
          />
        </div>

        {/* Category & Importance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              General Importance
            </label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as PreferenceImportance)}
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
            >
              <option value="must_have">Must Have</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            Create Preference
          </Button>
        </div>
      </form>
    </Modal>
  );
};
