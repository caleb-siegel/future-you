import React, { useState, useEffect } from 'react';
import type { Category, Memory, PreferenceImportance, PreferenceStatus } from '../../types';
import { CATEGORIES } from '../../types';
import { createPreference } from '../../services/preferences';
import { getMemories } from '../../services/memories';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertCircle, BookOpen, Check } from 'lucide-react';

interface CreatePreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (preferenceId: string) => void;
}

export const CreatePreferenceModal: React.FC<CreatePreferenceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Home');
  const [importance, setImportance] = useState<PreferenceImportance>('high');
  const [status, setStatus] = useState<PreferenceStatus>('active');
  const [supportingMemoryIds, setSupportingMemoryIds] = useState<string[]>([]);
  
  const [availableMemories, setAvailableMemories] = useState<Memory[]>([]);
  const [showMemoryPicker, setShowMemoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setTitle('');
      setDescription('');
      setCategory('Home');
      setImportance('high');
      setStatus('active');
      setSupportingMemoryIds([]);
      setError(null);
      setShowMemoryPicker(false);

      // Load available memories for association
      getMemories(user.uid, 50).then(setAvailableMemories).catch(console.error);
    }
  }, [isOpen, user]);

  const toggleMemorySelection = (id: string) => {
    if (supportingMemoryIds.includes(id)) {
      setSupportingMemoryIds(supportingMemoryIds.filter((mId) => mId !== id));
    } else {
      setSupportingMemoryIds([...supportingMemoryIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Preference title is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prefId = await createPreference({
        userId: user.uid,
        title: trimmedTitle,
        description: description.trim(),
        category,
        importance,
        status,
        supportingMemoryIds,
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
      title="Add Preference"
      description="Define a personal principle or criterion to guide future decisions."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Preference Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Prioritize natural light in home"
            className="w-full px-3.5 py-2 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Description & Context
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Why does this matter? What specific standard or principle do you want to hold?"
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

        {/* Supporting Memories Section */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700">
              Supporting Memories ({supportingMemoryIds.length})
            </span>
            <button
              type="button"
              onClick={() => setShowMemoryPicker(!showMemoryPicker)}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer underline"
            >
              {showMemoryPicker ? 'Close picker' : 'Attach memories'}
            </button>
          </div>

          {showMemoryPicker && (
            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl p-2 bg-stone-50/50 space-y-1.5">
              {availableMemories.length === 0 ? (
                <p className="text-xs text-stone-400 p-2 text-center">
                  No memories found to attach.
                </p>
              ) : (
                availableMemories.map((mem) => {
                  const isSelected = supportingMemoryIds.includes(mem.id);
                  return (
                    <div
                      key={mem.id}
                      onClick={() => toggleMemorySelection(mem.id)}
                      className={`p-2 rounded-lg text-xs cursor-pointer border flex items-start justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <p className="line-clamp-2 leading-relaxed">{mem.content}</p>
                      <div
                        className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center border mt-0.5 ${
                          isSelected
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Create Preference
          </Button>
        </div>
      </form>
    </Modal>
  );
};
