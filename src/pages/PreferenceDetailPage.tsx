import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPreferenceById,
  updatePreference,
  deletePreference,
} from '../services/preferences';
import { getMemoryById, getMemories } from '../services/memories';
import { getPlansForPreference, addPreferenceToPlan } from '../services/planItems';
import { getPlanById, getPlans } from '../services/plans';
import type { Preference, Memory, Plan, PreferenceImportance, PreferenceStatus } from '../types';
import { ImportanceBadge, StatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EditPreferenceModal } from '../components/preferences/EditPreferenceModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  BookOpen,
  Compass,
  Edit3,
  Trash2,
  Archive,
  ArchiveRestore,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Tag,
  Quote,
} from 'lucide-react';

export const PreferenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [preference, setPreference] = useState<Preference | null>(null);
  const [supportingMemories, setSupportingMemories] = useState<Memory[]>([]);
  const [associatedPlans, setAssociatedPlans] = useState<Plan[]>([]);
  const [allUserPlans, setAllUserPlans] = useState<Plan[]>([]);
  const [allUserMemories, setAllUserMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [isAddToPlanModalOpen, setIsAddToPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planActionError, setPlanActionError] = useState<string | null>(null);

  const loadPreferenceData = async () => {
    if (!id || !user) return;
    setIsLoading(true);
    try {
      const pref = await getPreferenceById(id, user.uid);
      if (!pref) {
        navigate('/preferences');
        return;
      }
      setPreference(pref);

      // Load supporting memories
      if (pref.supportingMemoryIds?.length) {
        const memPromises = pref.supportingMemoryIds.map((mId) =>
          getMemoryById(mId, user.uid)
        );
        const resolved = await Promise.all(memPromises);
        setSupportingMemories(resolved.filter((m): m is Memory => m !== null));
      } else {
        setSupportingMemories([]);
      }

      // Load associated plans
      const planIds = await getPlansForPreference(pref.id, user.uid);
      if (planIds.length) {
        const planPromises = planIds.map((pId) => getPlanById(pId, user.uid));
        const resolvedPlans = await Promise.all(planPromises);
        setAssociatedPlans(resolvedPlans.filter((p): p is Plan => p !== null));
      } else {
        setAssociatedPlans([]);
      }

      // Load other plans and memories for attachment options
      const [allPlans, allMemories] = await Promise.all([
        getPlans(user.uid, { status: 'active' }),
        getMemories(user.uid, 50),
      ]);
      setAllUserPlans(allPlans);
      setAllUserMemories(allMemories);
    } catch (err) {
      console.error('Failed to load preference detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreferenceData();
  }, [id, user]);

  const handleToggleArchive = async () => {
    if (!preference || !user) return;
    try {
      const newStatus: PreferenceStatus = preference.status === 'archived' ? 'active' : 'archived';
      await updatePreference(preference.id, user.uid, { status: newStatus });
      loadPreferenceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSupportingMemory = async (memoryId: string) => {
    if (!preference || !user) return;
    try {
      const updatedIds = preference.supportingMemoryIds.filter((mId) => mId !== memoryId);
      await updatePreference(preference.id, user.uid, { supportingMemoryIds: updatedIds });
      loadPreferenceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSupportingMemory = async (memoryId: string) => {
    if (!preference || !user) return;
    try {
      const updatedIds = Array.from(new Set([...preference.supportingMemoryIds, memoryId]));
      await updatePreference(preference.id, user.uid, { supportingMemoryIds: updatedIds });
      setIsAddMemoryModalOpen(false);
      loadPreferenceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!preference || !user) return;
    setIsDeleting(true);
    try {
      await deletePreference(preference.id, user.uid);
      navigate('/preferences');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddToPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !preference || !selectedPlanId) return;

    setIsSubmittingPlan(true);
    setPlanActionError(null);
    try {
      await addPreferenceToPlan({
        userId: user.uid,
        planId: selectedPlanId,
        preferenceId: preference.id,
        importance: preference.importance,
      });
      setIsAddToPlanModalOpen(false);
      setSelectedPlanId('');
      loadPreferenceData();
    } catch (err: any) {
      console.error(err);
      setPlanActionError(err?.message || 'Failed to add to plan.');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center text-stone-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading preference details...</span>
      </div>
    );
  }

  if (!preference) {
    return null;
  }

  return (
    <div className="space-y-8 animate-dialog-in max-w-4xl pb-16">
      {/* Navigation back */}
      <button
        onClick={() => navigate('/preferences')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Preferences</span>
      </button>

      {/* Main Preference Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Top Badges & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="stone" size="md">
              {preference.category}
            </Badge>
            <ImportanceBadge importance={preference.importance} size="md" />
            <StatusBadge status={preference.status} size="md" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              leftIcon={
                preference.status === 'archived' ? (
                  <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )
              }
            >
              {preference.status === 'archived' ? 'Reactivate' : 'Archive'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
          {preference.title}
        </h1>

        {/* Description */}
        {preference.description ? (
          <p className="text-stone-700 text-base leading-relaxed whitespace-pre-wrap">
            {preference.description}
          </p>
        ) : (
          <p className="text-stone-400 italic text-sm">No description provided.</p>
        )}

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span>Created {formatDate(preference.createdAt)}</span>
          {preference.updatedAt && (
            <span>Updated {formatDate(preference.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Supporting Memories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-stone-500" />
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              Original Supporting Memories ({supportingMemories.length})
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddMemoryModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Attach memory
          </Button>
        </div>

        {supportingMemories.length === 0 ? (
          <div className="p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center text-xs text-stone-500">
            No memories are currently attached as evidence for this preference.
          </div>
        ) : (
          <div className="space-y-3">
            {supportingMemories.map((mem) => (
              <div
                key={mem.id}
                className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-700">
                      {mem.category || 'Uncategorized'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(mem.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSupportingMemory(mem.id)}
                    className="text-stone-400 hover:text-rose-600 transition-colors text-xs cursor-pointer"
                    title="Remove memory from this preference"
                  >
                    Detach
                  </button>
                </div>

                <p className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {mem.content}
                </p>

                {mem.tags && mem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mem.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Associated Plans Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-stone-500" />
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              Associated Plans ({associatedPlans.length})
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddToPlanModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add to plan
          </Button>
        </div>

        {associatedPlans.length === 0 ? (
          <div className="p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center text-xs text-stone-500">
            This preference is not yet included in any future decision plan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {associatedPlans.map((pl) => (
              <div
                key={pl.id}
                onClick={() => navigate(`/plans/${pl.id}`)}
                className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">{pl.title}</h4>
                  <span className="text-xs text-stone-500">{pl.category}</span>
                </div>
                <StatusBadge status={pl.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <EditPreferenceModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        preference={preference}
        onSuccess={loadPreferenceData}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Preference?"
        message="Are you sure you want to delete this preference? Its original supporting memories will not be deleted."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Add Memory Modal */}
      <Modal
        isOpen={isAddMemoryModalOpen}
        onClose={() => setIsAddMemoryModalOpen(false)}
        title="Attach Supporting Memory"
        description="Select a recorded experience that supports this preference."
        maxWidth="md"
      >
        <div className="space-y-3 max-h-72 overflow-y-auto p-1">
          {allUserMemories
            .filter((m) => !preference.supportingMemoryIds?.includes(m.id))
            .map((mem) => (
              <div
                key={mem.id}
                onClick={() => handleAddSupportingMemory(mem.id)}
                className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>{mem.category || 'Uncategorized'}</span>
                  <span>{formatDate(mem.createdAt)}</span>
                </div>
                <p className="text-xs text-stone-800 line-clamp-3 leading-relaxed">
                  {mem.content}
                </p>
              </div>
            ))}
        </div>
      </Modal>

      {/* Add To Plan Modal */}
      <Modal
        isOpen={isAddToPlanModalOpen}
        onClose={() => setIsAddToPlanModalOpen(false)}
        title="Add Preference to Plan"
        description={`Add "${preference.title}" to an active decision plan.`}
        maxWidth="md"
      >
        <form onSubmit={handleAddToPlanSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none"
            >
              <option value="">Choose a plan...</option>
              {allUserPlans
                .filter((p) => !associatedPlans.some((ap) => ap.id === p.id))
                .map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title} ({pl.category})
                  </option>
                ))}
            </select>
          </div>

          {planActionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{planActionError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddToPlanModalOpen(false)}
              disabled={isSubmittingPlan}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedPlanId || isSubmittingPlan}
              isLoading={isSubmittingPlan}
            >
              Add to Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
