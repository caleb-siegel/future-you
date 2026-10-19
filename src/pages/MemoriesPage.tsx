import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMemories, deleteMemory, searchAndFilterMemories } from '../services/memories';
import { CATEGORIES, type Category, type Memory } from '../types';
import { MemoryCard } from '../components/memories/MemoryCard';
import { EditMemoryModal } from '../components/memories/EditMemoryModal';
import { CreatePreferenceFromMemoryModal } from '../components/memories/CreatePreferenceFromMemoryModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { QuickCapture } from '../components/memories/QuickCapture';
import {
  Search,
  Filter,
  Plus,
  Loader2,
  Tag,
  ArrowUpDown,
  BookOpen,
  Calendar,
  MapPin,
  Users,
  Sparkles,
} from 'lucide-react';

export const MemoriesPage: React.FC = () => {
  const { user } = useAuth();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [creatingPrefFromMemory, setCreatingPrefFromMemory] = useState<Memory | null>(null);
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);
  const [detailedMemory, setDetailedMemory] = useState<Memory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMemories = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getMemories(user.uid, 200);
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [user]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => {
      m.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [memories]);

  // Client-side search and filtering
  const filteredMemories = useMemo(() => {
    return searchAndFilterMemories(memories, {
      searchTerm,
      category: selectedCategory === 'all' ? null : selectedCategory,
      tag: selectedTag,
      sortOrder,
    });
  }, [memories, searchTerm, selectedCategory, selectedTag, sortOrder]);

  const handleConfirmDelete = async () => {
    if (!deletingMemory || !user) return;
    setIsDeleting(true);
    try {
      await deleteMemory(deletingMemory.id, user.uid);
      setDeletingMemory(null);
      if (detailedMemory?.id === deletingMemory.id) {
        setDetailedMemory(null);
      }
      loadMemories();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6 animate-dialog-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
            Memories
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Experiences, thoughts, observations, and lessons worth remembering.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsQuickCaptureOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto shadow-sm"
        >
          Capture memory
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by memory content, tags, location, or people..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50/70 hover:bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Uncategorized">Uncategorized</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-3 py-2 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer"
              title="Change sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Tags Row */}
        {allTags.length > 0 && (
          <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs text-stone-400 shrink-0 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3" />
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                selectedTag === null
                  ? 'bg-stone-900 text-stone-50 border-stone-900 font-medium'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-stone-900 text-stone-50 border-stone-900 font-medium'
                    : 'bg-stone-100/80 text-stone-600 border-stone-200 hover:bg-stone-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Memories Results Content */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-stone-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading memories...</span>
        </div>
      ) : filteredMemories.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title={
            searchTerm || selectedCategory !== 'all' || selectedTag
              ? 'No matching memories found'
              : 'No memories yet'
          }
          description={
            searchTerm || selectedCategory !== 'all' || selectedTag
              ? 'Try adjusting your search criteria or clearing filters.'
              : 'Capture thoughts, experiences, and observations so Future You can make better choices.'
          }
          actionLabel={
            searchTerm || selectedCategory !== 'all' || selectedTag
              ? 'Clear filters'
              : 'Capture first memory'
          }
          onAction={() => {
            if (searchTerm || selectedCategory !== 'all' || selectedTag) {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedTag(null);
            } else {
              setIsQuickCaptureOpen(true);
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((mem) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              onEdit={(m) => setEditingMemory(m)}
              onDelete={(m) => setDeletingMemory(m)}
              onCreatePreference={(m) => setCreatingPrefFromMemory(m)}
              onViewDetails={(m) => setDetailedMemory(m)}
            />
          ))}
        </div>
      )}

      {/* Memory Detail Modal (PRD 5.5) */}
      <Modal
        isOpen={Boolean(detailedMemory)}
        onClose={() => setDetailedMemory(null)}
        title="Memory Detail"
        description="Preserved observation and context."
        maxWidth="lg"
      >
        {detailedMemory && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-200/70">
              <span className="font-medium text-stone-700">
                {detailedMemory.category || 'Uncategorized'}
              </span>
              <div className="flex items-center gap-1 text-stone-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(detailedMemory.createdAt)}</span>
              </div>
            </div>

            <p className="text-stone-900 text-base leading-relaxed whitespace-pre-wrap">
              {detailedMemory.content}
            </p>

            {/* Tags & Context */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              {detailedMemory.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {detailedMemory.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg border border-stone-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {detailedMemory.location && (
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{detailedMemory.location}</span>
                </div>
              )}

              {detailedMemory.people && detailedMemory.people.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span>{detailedMemory.people.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Actions in detail view */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreatingPrefFromMemory(detailedMemory);
                  setDetailedMemory(null);
                }}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-600" />}
              >
                Form preference
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingMemory(detailedMemory);
                    setDetailedMemory(null);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setDeletingMemory(detailedMemory);
                    setDetailedMemory(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Capture Modal */}
      <Modal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        title="Capture Memory"
        description="Preserve what you observed, learned, or experienced."
        maxWidth="lg"
      >
        <QuickCapture
          onSuccess={() => {
            setIsQuickCaptureOpen(false);
            loadMemories();
          }}
          autoFocus={true}
        />
      </Modal>

      {/* Edit Modal */}
      <EditMemoryModal
        isOpen={Boolean(editingMemory)}
        onClose={() => setEditingMemory(null)}
        memory={editingMemory}
        onSuccess={loadMemories}
      />

      {/* Form Preference Modal */}
      <CreatePreferenceFromMemoryModal
        isOpen={Boolean(creatingPrefFromMemory)}
        onClose={() => setCreatingPrefFromMemory(null)}
        memory={creatingPrefFromMemory}
        onSuccess={() => {
          setCreatingPrefFromMemory(null);
          loadMemories();
        }}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deletingMemory)}
        onClose={() => setDeletingMemory(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Memory?"
        message="This memory will be permanently deleted. Any preferences that cite this memory as evidence will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
