import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Memory, PlanItem, PlanItemWithPreference, Preference, PreferenceImportance } from '../types';
import { db } from './firebase';

const COLLECTION_NAME = 'planItems';

export interface AddPreferenceToPlanInput {
  userId: string;
  planId: string;
  preferenceId: string;
  importance?: PreferenceImportance;
  notes?: string;
}

export const addPreferenceToPlan = async (input: AddPreferenceToPlanInput): Promise<string> => {
  // Prevent duplicate associations between the same plan and preference
  const existingQuery = query(
    collection(db, COLLECTION_NAME),
    where('planId', '==', input.planId),
    where('preferenceId', '==', input.preferenceId),
    where('userId', '==', input.userId)
  );

  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error('This preference is already added to the plan.');
  }

  // Get preference's default importance if none is provided
  let initialImportance: PreferenceImportance = input.importance || 'medium';
  if (!input.importance) {
    const prefDoc = await getDoc(doc(db, 'preferences', input.preferenceId));
    if (prefDoc.exists()) {
      initialImportance = prefDoc.data().importance || 'medium';
    }
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId: input.userId,
    planId: input.planId,
    preferenceId: input.preferenceId,
    importance: initialImportance,
    notes: (input.notes || '').trim(),
    checked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getPlanItemsForPlan = async (
  planId: string,
  userId: string
): Promise<PlanItemWithPreference[]> => {
  const itemsQuery = query(
    collection(db, COLLECTION_NAME),
    where('planId', '==', planId),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(itemsQuery);
  const items: PlanItem[] = snapshot.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<PlanItem, 'id'>),
  }));

  // Fetch preferences and memories for detailed plan view
  const result: PlanItemWithPreference[] = [];

  for (const item of items) {
    const prefDoc = await getDoc(doc(db, 'preferences', item.preferenceId));
    if (prefDoc.exists() && prefDoc.data().userId === userId) {
      const prefData = { id: prefDoc.id, ...prefDoc.data() } as Preference;
      
      // Fetch supporting memories
      const supportingMemories: Memory[] = [];
      if (prefData.supportingMemoryIds?.length) {
        for (const memId of prefData.supportingMemoryIds) {
          const memDoc = await getDoc(doc(db, 'memories', memId));
          if (memDoc.exists() && memDoc.data().userId === userId) {
            supportingMemories.push({ id: memDoc.id, ...memDoc.data() } as Memory);
          }
        }
      }

      result.push({
        ...item,
        preference: prefData,
        supportingMemories,
      });
    } else {
      // Preference was deleted or not found
      result.push({
        ...item,
      });
    }
  }

  return result;
};

export const updatePlanItem = async (
  id: string,
  userId: string,
  updates: {
    importance?: PreferenceImportance;
    notes?: string;
    checked?: boolean;
  }
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Plan item not found or unauthorized');
  }

  const patch: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.importance !== undefined) {
    patch.importance = updates.importance;
  }
  if (updates.notes !== undefined) {
    patch.notes = updates.notes.trim();
  }
  if (updates.checked !== undefined) {
    patch.checked = updates.checked;
  }

  await updateDoc(docRef, patch);
};

export const removePlanItem = async (id: string, userId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Plan item not found or unauthorized');
  }

  await deleteDoc(docRef);
};

export const getPlansForPreference = async (
  preferenceId: string,
  userId: string
): Promise<string[]> => {
  const itemsQuery = query(
    collection(db, COLLECTION_NAME),
    where('preferenceId', '==', preferenceId),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(itemsQuery);
  return Array.from(new Set(snapshot.docs.map(d => d.data().planId as string)));
};
