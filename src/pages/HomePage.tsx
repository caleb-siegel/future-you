import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMemories, deleteMemory } from '../services/memories';
import { getPreferences, deletePreference, updatePreference } from '../services/preferences';
import { getPlans, deletePlan, updatePlan } from '../services/plans';
import type { Memory, Preference, Plan } from '../types';
import { QuickCapture } from '../components/memories/QuickCapture';
import { MemoryCard } from '../components/memories/MemoryCard';
import { PreferenceCard } from '../components/preferences/PreferenceCard';
import { PlanCard } from '../components/plans/PlanCard';
import { EditMemoryModal } from '../components/memories/EditMemoryModal';
import { CreatePreferenceFromMemoryModal } from '../components/memories/CreatePreferenceFromMemoryModal';
import { EditPreferenceModal } from '../components/preferences/EditPreferenceModal';
import { EditPlanModal } from '../components/plans/EditPlanModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  Plus,
  Loader2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [activePreferences, setActivePreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [creatingPrefFromMemory, setCreatingPrefFromMemory] = useState<Memory | null>(null);
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);

  const [editingPreference, setEditingPreference] = useState<Preference | null>(null);
  const [deletingPreference, setDeletingPreference] = useState<Preference | null>(null);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [mems, plans, prefs] = await Promise.all([
        getMemories(user.uid, 5),
        getPlans(user.uid, { status: 'active', maxResults: 4 }),
        getPreferences(user.uid, { status: 'active', maxResults: 4 }),
      ]);
      setRecentMemories(mems);
      setActivePlans(plans);
      setActivePreferences(prefs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleConfirmDeleteMemory = async () => {
    if (!deletingMemory || !user) return;
    setIsDeleting(true);
    try {
      await deleteMemory(deletingMemory.id, user.uid);
      setDeletingMemory(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeletePreference = async () => {
    if (!deletingPreference || !user) return;
    setIsDeleting(true);
    try {
      await deletePreference(deletingPreference.id, user.uid);
      setDeletingPreference(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleArchivePreference = async (pref: Preference) => {
    if (!user) return;
    try {
      const newStatus = pref.status === 'archived' ? 'active' : 'archived';
      await updatePreference(pref.id, user.uid, { status: newStatus });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!deletingPlan || !user) return;
    setIsDeleting(true);
    try {
      await deletePlan(deletingPlan.id, user.uid);
      setDeletingPlan(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePlanStatus = async (plan: Plan) => {
    if (!user) return;
    try {
      const newStatus = plan.status === 'completed' ? 'active' : 'completed';
      await updatePlan(plan.id, user.uid, { status: newStatus });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 animate-dialog-in pb-12">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif-editorial">
          {getGreeting()},{' '}
          <span className="font-sans font-medium text-stone-700">
            {user?.displayName || user?.email?.split('@')[0] || 'Friend'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Remember what your past experiences have taught you as you shape future decisions.
        </p>
      </div>

      {/* Primary Card: Quick Capture */}
      <section aria-label="Quick Capture Area">
        <QuickCapture inline={true} onSuccess={loadDashboardData} />
      </section>

      {isLoading ? (
        <div className="py-16 flex items-center justify-center text-stone-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your personal knowledge base...</span>
        </div>
      ) : (
        <>
          {/* Recent Memories Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-stone-600" />
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                  Recent Memories
                </h2>
              </div>
              {recentMemories.length > 0 && (
                <button
                  onClick={() => navigate('/memories')}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentMemories.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-5 h-5" />}
                title="No memories captured yet"
                description="Start by capturing an experience, lesson, or observation in the box above."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentMemories.map((mem) => (
                  <MemoryCard
                    key={mem.id}
                    memory={mem}
                    onEdit={(m) => setEditingMemory(m)}
                    onDelete={(m) => setDeletingMemory(m)}
                    onCreatePreference={(m) => setCreatingPrefFromMemory(m)}
                    onViewDetails={() => navigate('/memories')}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Active Plans Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-stone-600" />
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                  Active Plans
                </h2>
              </div>
              {activePlans.length > 0 && (
                <button
                  onClick={() => navigate('/plans')}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>All plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activePlans.length === 0 ? (
              <EmptyState
                icon={<Compass className="w-5 h-5" />}
                title="No active plans yet"
                description="Create a future plan (like finding an apartment or planning travel) to gather relevant preferences."
                actionLabel="Create a plan"
                onAction={() => navigate('/plans')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onViewDetails={() => navigate(`/plans/${plan.id}`)}
                    onEdit={(p) => setEditingPlan(p)}
                    onDelete={(p) => setDeletingPlan(p)}
                    onToggleStatus={handleTogglePlanStatus}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Active Preferences Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                  Core Preferences
                </h2>
              </div>
              {activePreferences.length > 0 && (
                <button
                  onClick={() => navigate('/preferences')}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activePreferences.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="w-5 h-5" />}
                title="No preferences formed yet"
                description="Turn your memories into lasting principles, or define your personal criteria."
                actionLabel="Explore preferences"
                onAction={() => navigate('/preferences')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePreferences.map((pref) => (
                  <PreferenceCard
                    key={pref.id}
                    preference={pref}
                    onEdit={(p) => setEditingPreference(p)}
                    onDelete={(p) => setDeletingPreference(p)}
                    onToggleArchive={handleToggleArchivePreference}
                    onViewDetails={() => navigate(`/preferences/${pref.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Memory Edit & Preference Creation Modals */}
      <EditMemoryModal
        isOpen={Boolean(editingMemory)}
        onClose={() => setEditingMemory(null)}
        memory={editingMemory}
        onSuccess={loadDashboardData}
      />

      <CreatePreferenceFromMemoryModal
        isOpen={Boolean(creatingPrefFromMemory)}
        onClose={() => setCreatingPrefFromMemory(null)}
        memory={creatingPrefFromMemory}
        onSuccess={() => {
          setCreatingPrefFromMemory(null);
          loadDashboardData();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingMemory)}
        onClose={() => setDeletingMemory(null)}
        onConfirm={handleConfirmDeleteMemory}
        title="Delete Memory?"
        message="This memory will be permanently removed. Any preferences supported by this memory will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Preference Edit & Delete Modals */}
      <EditPreferenceModal
        isOpen={Boolean(editingPreference)}
        onClose={() => setEditingPreference(null)}
        preference={editingPreference}
        onSuccess={loadDashboardData}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPreference)}
        onClose={() => setDeletingPreference(null)}
        onConfirm={handleConfirmDeletePreference}
        title="Delete Preference?"
        message="Are you sure you want to delete this preference? Its original supporting memories will not be deleted."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {/* Plan Edit & Delete Modals */}
      <EditPlanModal
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        plan={editingPlan}
        onSuccess={loadDashboardData}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleConfirmDeletePlan}
        title="Delete Plan?"
        message="Are you sure you want to delete this plan? Associated preferences and memories will remain intact."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
