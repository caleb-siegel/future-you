import React, { useState } from 'react';
import type { Category } from '../../types';
import { CATEGORIES } from '../../types';
import { createPlan } from '../../services/plans';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertCircle, Compass } from 'lucide-react';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (planId: string) => void;
  initialCategory?: Category;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory || 'Home');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a title for your plan.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const planId = await createPlan({
        userId: user.uid,
        title: trimmedTitle,
        description: description.trim(),
        category,
        status: 'active',
      });

      setTitle('');
      setDescription('');
      onSuccess(planId);
      onClose();
    } catch (err: any) {
      console.error('Failed to create plan:', err);
      setError(err?.message || 'Failed to create plan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Plan"
      description="Define a future decision, project, or goal (e.g. Find Our Next Apartment, Plan Vacation)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Plan Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Find Our Next Apartment"
            className="w-full px-3.5 py-2 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What decision or milestone are you preparing for?"
            className="w-full px-3.5 py-2 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none resize-none"
          />
        </div>

        {/* Category */}
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
            leftIcon={<Compass className="w-4 h-4 text-amber-300" />}
          >
            Create Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
};
