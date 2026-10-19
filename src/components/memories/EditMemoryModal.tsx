import React, { useState, useEffect } from 'react';
import type { Category, Memory } from '../../types';
import { CATEGORIES } from '../../types';
import { updateMemory } from '../../services/memories';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tag, MapPin, Users, AlertCircle } from 'lucide-react';

interface EditMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onSuccess: () => void;
}

export const EditMemoryModal: React.FC<EditMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onSuccess,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [peopleInput, setPeopleInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memory) {
      setContent(memory.content || '');
      setCategory((memory.category as Category) || '');
      setTags(memory.tags || []);
      setLocation(memory.location || '');
      setPeople(memory.people || []);
      setError(null);
    }
  }, [memory]);

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddPerson = () => {
    const clean = peopleInput.trim();
    if (clean && !people.includes(clean)) {
      setPeople([...people, clean]);
      setPeopleInput('');
    }
  };

  const handleRemovePerson = (personToRemove: string) => {
    setPeople(people.filter(p => p !== personToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory) return;

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Memory content cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateMemory(memory.id, memory.userId, {
        content: trimmed,
        category: category || null,
        tags,
        location: location.trim() || undefined,
        people,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update memory:', err);
      setError(err?.message || 'Failed to update memory.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Memory"
      description="Update your recorded thought, observation, or context."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Memory Content */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Memory Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={10000}
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 transition-all"
            placeholder="Edit memory content..."
          />
          <div className="flex justify-end text-[11px] text-stone-400 mt-1">
            {content.length} / 10,000
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | '')}
            className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
          >
            <option value="">Uncategorized</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg border border-stone-200"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Location & People */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location..."
                className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              People
            </label>
            <div className="relative">
              <Users className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={peopleInput}
                onChange={(e) => setPeopleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPerson();
                  }
                }}
                placeholder="Add person..."
                className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
              />
            </div>
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
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
