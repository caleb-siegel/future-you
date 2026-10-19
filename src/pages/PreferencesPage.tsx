import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPreferences,
  deletePreference,
  updatePreference,
} from '../services/preferences';
import { getPlans } from '../services/plans';
import { addPreferenceToPlan } from '../services/planItems';
import { CATEGORIES, type Category, type Preference, type PreferenceImportance, type PreferenceStatus, type Plan } from '../types';
import { PreferenceCard } from '../components/preferences/PreferenceCard';
import { CreatePreferenceModal } from '../components/preferences/CreatePreferenceModal';
import { EditPreferenceModal } from '../components/preferences/EditPreferenceModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Loader2,
  Compass,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<PreferenceStatus>('active');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<Preference | null>(null);
  const [deletingPreference, setDeletingPreference] = useState<Preference | null>(null);
  const [addingToPlanPreference, setAddingToPlanPreference] = useState<Preference | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);
  const [planActionError, setPlanActionError] = useState<string | null>(null);
  const [planActionSuccess, setPlanActionSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPreferences = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [prefs, userPlans] = await Promise.all([
        getPreferences(user.uid),
        getPlans(user.uid, { status: 'active' }),
      ]);
      setPreferences(prefs);
      setPlans(userPlans);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const filteredPreferences = useMemo(() => {
    return preferences.filter((p) => {
      // Status tab match
      if (p.status !== statusTab) return false;

      // Category match
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // Importance match
      if (selectedImportance !== 'all' && p.importance !== selectedImportance) return false;

      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(term);
        const matchDesc = p.description.toLowerCase().includes(term);
        const matchCat = p.category.toLowerCase().includes(term);
        return matchTitle || matchDesc || matchCat;
      }

      return true;
    });
  }, [preferences, statusTab, selectedCategory, selectedImportance, searchTerm]);

  const handleToggleArchive = async (pref: Preference) => {
    if (!user) return;
    try {
      const newStatus: PreferenceStatus = pref.status === 'archived' ? 'active' : 'archived';
      await updatePreference(pref.id, user.uid, { status: newStatus });
      loadPreferences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPreference || !user) return;
    setIsDeleting(true);
    try {
      await deletePreference(deletingPreference.id, user.uid);
      setDeletingPreference(null);
      loadPreferences();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddToPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addingToPlanPreference || !selectedPlanId) return;

    setIsAddingToPlan(true);
    setPlanActionError(null);
    try {
      await addPreferenceToPlan({
        userId: user.uid,
        planId: selectedPlanId,
        preferenceId: addingToPlanPreference.id,
        importance: addingToPlanPreference.importance,
      });

      setPlanActionSuccess('Preference added to plan successfully.');
      setTimeout(() => {
        setAddingToPlanPreference(null);
        setSelectedPlanId('');
        setPlanActionSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to add preference to plan:', err);
      setPlanActionError(err?.message || 'Failed to add preference to plan.');
    } finally {
      setIsAddingToPlan(false);
    }
  };

  return (
    <div className="space-y-6 animate-dialog-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
            Preferences
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Principles, criteria, and conclusions drawn from your experiences.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto shadow-sm"
        >
          Add preference
        </Button>
      </div>

      {/* Status Tabs (Active, Reconsider, Archived) */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-1">
        {(['active', 'reconsider', 'archived'] as PreferenceStatus[]).map((tab) => {
          const count = preferences.filter((p) => p.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-t-xl transition-colors cursor-pointer capitalize flex items-center gap-1.5 ${
                statusTab === tab
                  ? 'border-b-2 border-stone-900 text-stone-950 font-semibold bg-stone-100/60'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>{tab}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 font-normal">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search preferences..."
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

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Importance Filter */}
        <select
          value={selectedImportance}
          onChange={(e) => setSelectedImportance(e.target.value)}
          className="px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All Importance</option>
          <option value="must_have">Must Have</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Preferences List Content */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-stone-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading preferences...</span>
        </div>
      ) : filteredPreferences.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title={
            searchTerm || selectedCategory !== 'all' || selectedImportance !== 'all'
              ? 'No matching preferences'
              : statusTab === 'archived'
              ? 'No archived preferences'
              : statusTab === 'reconsider'
              ? 'No preferences marked for reconsideration'
              : 'No preferences yet'
          }
          description={
            searchTerm || selectedCategory !== 'all' || selectedImportance !== 'all'
              ? 'Try modifying your filters or search terms.'
              : 'Preferences help you remember what matters when making future choices.'
          }
          actionLabel={statusTab === 'active' ? 'Add preference' : undefined}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPreferences.map((pref) => (
            <PreferenceCard
              key={pref.id}
              preference={pref}
              onEdit={(p) => setEditingPreference(p)}
              onDelete={(p) => setDeletingPreference(p)}
              onToggleArchive={handleToggleArchive}
              onAddToPlan={(p) => {
                setAddingToPlanPreference(p);
                setPlanActionError(null);
                setPlanActionSuccess(null);
              }}
              onViewDetails={(p) => navigate(`/preferences/${p.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add To Plan Modal */}
      <Modal
        isOpen={Boolean(addingToPlanPreference)}
        onClose={() => setAddingToPlanPreference(null)}
        title="Add Preference to Plan"
        description={
          addingToPlanPreference
            ? `Associate "${addingToPlanPreference.title}" with a future decision or plan.`
            : ''
        }
        maxWidth="md"
      >
        <form onSubmit={handleAddToPlanSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Plan
            </label>
            {plans.length === 0 ? (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
                You don't have any active plans yet. Create a plan first from the Plans page.
              </div>
            ) : (
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
              >
                <option value="">Choose a plan...</option>
                {plans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title} ({pl.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          {planActionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{planActionError}</span>
            </div>
          )}

          {planActionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{planActionSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
            <Button
              variant="outline"
              type="button"
              onClick={() => setAddingToPlanPreference(null)}
              disabled={isAddingToPlan}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedPlanId || plans.length === 0 || isAddingToPlan}
              isLoading={isAddingToPlan}
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Add to Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Modal */}
      <CreatePreferenceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          loadPreferences();
        }}
      />

      {/* Edit Modal */}
      <EditPreferenceModal
        isOpen={Boolean(editingPreference)}
        onClose={() => setEditingPreference(null)}
        preference={editingPreference}
        onSuccess={loadPreferences}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deletingPreference)}
        onClose={() => setDeletingPreference(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Preference?"
        message="This preference will be permanently deleted. Its underlying supporting memories will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
