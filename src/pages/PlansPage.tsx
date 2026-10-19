import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPlans, deletePlan, updatePlan } from '../services/plans';
import { getPlanItemsForPlan } from '../services/planItems';
import { CATEGORIES, type Category, type Plan, type PlanStatus } from '../types';
import { PlanCard } from '../components/plans/PlanCard';
import { CreatePlanModal } from '../components/plans/CreatePlanModal';
import { EditPlanModal } from '../components/plans/EditPlanModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import {
  Compass,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Archive,
} from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [planStats, setPlanStats] = useState<
    Record<string, { total: number; completed: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusTab, setStatusTab] = useState<PlanStatus>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPlans = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getPlans(user.uid);
      setPlans(data);

      // Load items count and checked state for each plan
      const statsMap: Record<string, { total: number; completed: number }> = {};
      await Promise.all(
        data.map(async (pl) => {
          try {
            const items = await getPlanItemsForPlan(pl.id, user.uid);
            statsMap[pl.id] = {
              total: items.length,
              completed: items.filter((i) => i.checked).length,
            };
          } catch (e) {
            statsMap[pl.id] = { total: 0, completed: 0 };
          }
        })
      );
      setPlanStats(statsMap);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [user]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      // Status tab
      if (p.status !== statusTab) return false;

      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(term);
        const matchDesc = p.description.toLowerCase().includes(term);
        const matchCat = p.category.toLowerCase().includes(term);
        return matchTitle || matchDesc || matchCat;
      }

      return true;
    });
  }, [plans, statusTab, selectedCategory, searchTerm]);

  const handleToggleStatus = async (plan: Plan) => {
    if (!user) return;
    try {
      const nextStatus: PlanStatus = plan.status === 'completed' ? 'active' : 'completed';
      await updatePlan(plan.id, user.uid, { status: nextStatus });
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan || !user) return;
    setIsDeleting(true);
    try {
      await deletePlan(deletingPlan.id, user.uid);
      setDeletingPlan(null);
      loadPlans();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-dialog-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
            Decision Plans
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Organize what matters for upcoming goals, life decisions, or purchases.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="self-start sm:self-auto shadow-sm"
        >
          Create plan
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200/80 pb-1">
        {(['active', 'completed', 'archived'] as PlanStatus[]).map((tab) => {
          const count = plans.filter((p) => p.status === tab).length;
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

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plans..."
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
      </div>

      {/* Plans List Content */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-stone-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading plans...</span>
        </div>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-6 h-6" />}
          title={
            searchTerm || selectedCategory !== 'all'
              ? 'No matching plans'
              : statusTab === 'completed'
              ? 'No completed plans'
              : statusTab === 'archived'
              ? 'No archived plans'
              : 'No plans created yet'
          }
          description={
            searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search query or category filter.'
              : 'Create a plan for an apartment search, vacation, or career change to remember what matters.'
          }
          actionLabel={statusTab === 'active' ? 'Create a plan' : undefined}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              itemCount={planStats[plan.id]?.total || 0}
              completedItemCount={planStats[plan.id]?.completed || 0}
              onViewDetails={() => navigate(`/plans/${plan.id}`)}
              onEdit={(p) => setEditingPlan(p)}
              onDelete={(p) => setDeletingPlan(p)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreatePlanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newPlanId) => {
          setIsCreateOpen(false);
          navigate(`/plans/${newPlanId}`);
        }}
      />

      {/* Edit Modal */}
      <EditPlanModal
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
        onSuccess={loadPlans}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Plan?"
        message="This plan and its checklist items will be removed. Your preferences and memories will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
