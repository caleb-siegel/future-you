import React, { useState } from 'react';
import { Sparkles, Tag, ChevronDown, ChevronUp, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { CATEGORIES, type Category } from '../../types';
import { createMemory } from '../../services/memories';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface QuickCaptureProps {
  onSuccess?: (memoryId: string) => void;
  inline?: boolean;
  autoFocus?: boolean;
}

export const QuickCapture: React.FC<QuickCaptureProps> = ({
  onSuccess,
  inline = false,
  autoFocus = false,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [peopleInput, setPeopleInput] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setError('You must be signed in to save memories.');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Please enter a memory or thought before saving.');
      return;
    }

    if (trimmed.length > 10000) {
      setError('Memory content exceeds the 10,000 character limit.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const memoryId = await createMemory({
        userId: user.uid,
        content: trimmed,
        category: category || null,
        tags,
        location: location.trim() || undefined,
        people,
      });

      // Clear form on success
      setContent('');
      setCategory('');
      setTags([]);
      setTagInput('');
      setLocation('');
      setPeople([]);
      setPeopleInput('');
      setIsExpanded(false);

      setSuccessMessage('Memory captured successfully.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);

      if (onSuccess) {
        onSuccess(memoryId);
      }
    } catch (err: any) {
      console.error('Failed to save memory:', err);
      setError(err?.message || 'Failed to save memory. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Quick-save shortcut: Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`rounded-2xl transition-all ${
        inline
          ? 'bg-white border border-stone-200/90 shadow-sm p-5 sm:p-6'
          : 'bg-transparent'
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Prompt */}
        {inline && (
          <div className="flex items-center justify-between pb-1">
            <label
              htmlFor="quick-capture-input"
              className="text-sm font-semibold text-stone-800 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              What's something you want Future You to remember?
            </label>
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Press ⌘+Enter to save
            </span>
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            id="quick-capture-input"
            autoFocus={autoFocus}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            rows={inline ? (isExpanded ? 5 : 3) : 5}
            maxLength={10000}
            placeholder="What happened, what did you learn, or what do you want your future self to remember?"
            className="w-full px-4 py-3 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-stone-900 placeholder:text-stone-400 text-sm sm:text-base rounded-xl border border-stone-200/90 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-y"
          />
          <div className="flex items-center justify-between mt-1 px-1">
            <span className="text-[11px] text-stone-400">
              {content.length > 0 && `${content.length} / 10,000 characters`}
            </span>
          </div>
        </div>

        {/* Expandable Optional Details Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 py-1 cursor-pointer transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide optional details</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Add category, tags, or context</span>
              </>
            )}
          </button>
        </div>

        {/* Optional Fields (Category, Tags, People, Location) */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-stone-100 animate-fadeIn">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Category (optional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category | '')}
                className="w-full sm:w-64 px-3 py-2 bg-white text-stone-800 text-xs sm:text-sm rounded-xl border border-stone-200/90 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300"
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
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Tags (optional)
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
                      className="text-stone-400 hover:text-stone-700 ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:max-w-xs">
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
                    placeholder="e.g. apartment, travel, budget"
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

            {/* People & Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Location (optional)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cape Town, Apartment 3B"
                    className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  People (optional)
                </label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {people.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(p)}
                        className="text-stone-400 hover:text-stone-700 ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
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
                      placeholder="e.g. Sarah, Partner"
                      className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddPerson}
                    disabled={!peopleInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!content.trim()}
            className="w-full sm:w-auto"
          >
            Save Memory
          </Button>
        </div>
      </form>
    </div>
  );
};
