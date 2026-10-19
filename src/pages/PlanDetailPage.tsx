import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPlanById, updatePlan, deletePlan } from '../services/plans';
import {
  getPlanItemsForPlan,
  updatePlanItem,
  removePlanItem,
} from '../services/planItems';
import type {
  Plan,
  PlanItemWithPreference,
  PreferenceImportance,
  PlanStatus,
} from '../types';
import { ImportanceBadge, StatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EditPlanModal } from '../components/plans/EditPlanModal';
import { AddPreferencesToPlanModal } from '../components/plans/AddPreferencesToPlanModal';
import {
  ArrowLeft,
  Compass,
  Plus,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
  Quote,
} from 'lucide-react';

export const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanItemWithPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded memories accordion by plan item id
  const [expandedMemories, setExpandedMemories] = useState<Record<string, boolean>>({});

  // Editing notes state
  const [editingNotesItemId, setEditingNotesItemId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Modals state
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [isDeletePlanOpen, setIsDeletePlanOpen] = useState(false);
  const [isAddPreferencesOpen, setIsAddPreferencesOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<PlanItemWithPreference | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPlanData = async () => {
    if (!id || !user) return;
    setIsLoading(true);
    try {
      const fetchedPlan = await getPlanById(id, user.uid);
      if (!fetchedPlan) {
        navigate('/plans');
        return;
      }
      setPlan(fetchedPlan);

      const planItems = await getPlanItemsForPlan(id, user.uid);
      setItems(planItems);
    } catch (err) {
      console.error('Failed to load plan detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlanData();
  }, [id, user]);

  const handleToggleItemChecked = async (item: PlanItemWithPreference) => {
    if (!user) return;
    try {
      const nextChecked = !item.checked;
      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: nextChecked } : i))
      );
      await updatePlanItem(item.id, user.uid, { checked: nextChecked });
    } catch (err) {
      console.error(err);
      loadPlanData();
    }
  };

  const handleImportanceChange = async (
    item: PlanItemWithPreference,
    newImportance: PreferenceImportance
  ) => {
    if (!user) return;
    try {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, importance: newImportance } : i))
      );
      await updatePlanItem(item.id, user.uid, { importance: newImportance });
    } catch (err) {
      console.error(err);
      loadPlanData();
    }
  };

  const handleSaveNotes = async (item: PlanItemWithPreference) => {
    if (!user) return;
    try {
      await updatePlanItem(item.id, user.uid, { notes: notesInput.trim() });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, notes: notesInput.trim() } : i))
      );
      setEditingNotesItemId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmRemoveItem = async () => {
    if (!itemToRemove || !user) return;
    try {
      await removePlanItem(itemToRemove.id, user.uid);
      setItemToRemove(null);
      loadPlanData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePlanStatus = async () => {
    if (!plan || !user) return;
    try {
      const nextStatus: PlanStatus = plan.status === 'completed' ? 'active' : 'completed';
      await updatePlan(plan.id, user.uid, { status: nextStatus });
      loadPlanData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!plan || !user) return;
    setIsDeleting(true);
    try {
      await deletePlan(plan.id, user.uid);
      navigate('/plans');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAccordion = (itemId: string) => {
    setExpandedMemories((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
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

  const completedCount = items.filter((i) => i.checked).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center text-stone-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading plan...</span>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="space-y-8 animate-dialog-in max-w-4xl pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/plans')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Decision Plans</span>
      </button>

      {/* Plan Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="stone" size="md">
              {plan.category}
            </Badge>
            <StatusBadge status={plan.status} size="md" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePlanStatus}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            >
              {plan.status === 'completed' ? 'Reopen Plan' : 'Mark Completed'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditPlanOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeletePlanOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Plan Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
          {plan.title}
        </h1>

        {/* Plan Description */}
        {plan.description && (
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {plan.description}
          </p>
        )}

        {/* Progress summary bar */}
        {items.length > 0 && (
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
              <span className="font-medium">
                {completedCount} of {items.length} criteria reviewed
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Plan Items / Preferences Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              Preferences for this Plan ({items.length})
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddPreferencesOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add preferences
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 bg-stone-50/70 rounded-2xl border border-dashed border-stone-200 text-center space-y-3">
            <Sparkles className="w-6 h-6 text-stone-400 mx-auto" />
            <h3 className="text-sm font-semibold text-stone-800">No preferences associated yet</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Attach existing preferences to this plan so you can review what matters most when making your decision.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddPreferencesOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add preferences
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const pref = item.preference;
              const memories = item.supportingMemories || [];
              const isAccordionOpen = expandedMemories[item.id] || false;
              const isEditingNotes = editingNotesItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs space-y-3 ${
                    item.checked
                      ? 'border-stone-200/60 bg-stone-50/40 opacity-80'
                      : 'border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  {/* Item top row: Checkbox, Title, Importance Dropdown, Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleItemChecked(item)}
                        className="mt-0.5 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors shrink-0"
                        title={item.checked ? 'Mark unreviewed' : 'Mark reviewed'}
                      >
                        {item.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            onClick={() => {
                              if (pref) navigate(`/preferences/${pref.id}`);
                            }}
                            className={`text-sm sm:text-base font-semibold text-stone-900 ${
                              pref ? 'cursor-pointer hover:text-stone-700' : ''
                            } ${item.checked ? 'line-through text-stone-500' : ''}`}
                          >
                            {pref?.title || 'Unknown preference'}
                          </h4>

                          {pref?.category && (
                            <Badge variant="stone" size="sm">
                              {pref.category}
                            </Badge>
                          )}
                        </div>

                        {pref?.description && (
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {pref.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Plan-specific Importance selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">
                          Plan Priority
                        </span>
                        <select
                          value={item.importance}
                          onChange={(e) =>
                            handleImportanceChange(
                              item,
                              e.target.value as PreferenceImportance
                            )
                          }
                          className="text-xs font-medium px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 text-stone-800 cursor-pointer focus:outline-none"
                        >
                          <option value="must_have">Must Have</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>

                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={() => setItemToRemove(item)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Remove from plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Plan-specific Notes */}
                  <div className="pt-2 border-t border-stone-100">
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          rows={2}
                          placeholder="Notes specific to this plan..."
                          className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded-xl border border-stone-300 focus:outline-none focus:bg-white"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNotesItemId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveNotes(item)}
                          >
                            Save notes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between text-xs text-stone-500">
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                          {item.notes ? (
                            <span className="text-stone-700 italic">{item.notes}</span>
                          ) : (
                            <span className="text-stone-400 italic">No plan notes added</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingNotesItemId(item.id);
                            setNotesInput(item.notes || '');
                          }}
                          className="text-[11px] font-medium text-stone-500 hover:text-stone-900 cursor-pointer ml-2"
                        >
                          {item.notes ? 'Edit note' : 'Add note'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Supporting Memories Toggle (PRD 5.9: "Review the original memories supporting each preference") */}
                  {memories.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(item.id)}
                        className="text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Quote className="w-3 h-3 text-stone-400" />
                        <span>
                          {memories.length} supporting {memories.length === 1 ? 'memory' : 'memories'} behind this preference
                        </span>
                        {isAccordionOpen ? (
                          <ChevronUp className="w-3 h-3 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-stone-400" />
                        )}
                      </button>

                      {isAccordionOpen && (
                        <div className="mt-2 space-y-2 pl-3 border-l-2 border-stone-200">
                          {memories.map((mem) => (
                            <div
                              key={mem.id}
                              className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/60 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] text-stone-400">
                                <span>{mem.category || 'Observation'}</span>
                                <span>{formatDate(mem.createdAt)}</span>
                              </div>
                              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                                "{mem.content}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Plan Modal */}
      <EditPlanModal
        isOpen={isEditPlanOpen}
        onClose={() => setIsEditPlanOpen(false)}
        plan={plan}
        onSuccess={loadPlanData}
      />

      {/* Add Preferences Modal */}
      <AddPreferencesToPlanModal
        isOpen={isAddPreferencesOpen}
        onClose={() => setIsAddPreferencesOpen(false)}
        planId={plan.id}
        existingPreferenceIds={items.map((i) => i.preferenceId)}
        onSuccess={loadPlanData}
      />

      {/* Confirm Delete Plan */}
      <ConfirmDialog
        isOpen={isDeletePlanOpen}
        onClose={() => setIsDeletePlanOpen(false)}
        onConfirm={handleConfirmDeletePlan}
        title="Delete Plan?"
        message="This plan and its checklist items will be deleted. Associated preferences and memories will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Confirm Remove Item */}
      <ConfirmDialog
        isOpen={Boolean(itemToRemove)}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleConfirmRemoveItem}
        title="Remove Preference from Plan?"
        message="This preference will be removed from this plan. The preference and its supporting memories will not be deleted."
        confirmLabel="Remove"
        isDestructive={false}
      />
    </div>
  );
};
