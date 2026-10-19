import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import type { Category, Plan, PlanStatus } from '../types';
import { db } from './firebase';

const COLLECTION_NAME = 'plans';

export interface CreatePlanInput {
  userId: string;
  title: string;
  description?: string;
  category?: Category | string;
  status?: PlanStatus;
}

export interface UpdatePlanInput {
  title?: string;
  description?: string;
  category?: Category | string;
  status?: PlanStatus;
}

export const createPlan = async (input: CreatePlanInput): Promise<string> => {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    throw new Error('Plan title is required.');
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId: input.userId,
    title: trimmedTitle,
    description: (input.description || '').trim(),
    category: input.category || 'Other',
    status: input.status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getPlans = async (
  userId: string,
  options?: {
    status?: PlanStatus;
    category?: string;
    maxResults?: number;
  }
): Promise<Plan[]> => {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    limit(options?.maxResults || 100)
  );

  const snapshot = await getDocs(q);
  let plans = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Plan, 'id'>),
  }));

  plans.sort((a, b) => {
    const aTime = (a.createdAt as Timestamp)?.toMillis?.() || 0;
    const bTime = (b.createdAt as Timestamp)?.toMillis?.() || 0;
    return bTime - aTime;
  });

  if (options?.status) {
    plans = plans.filter(p => p.status === options.status);
  }

  if (options?.category) {
    plans = plans.filter(p => p.category === options.category);
  }

  return plans;
};

export const getPlanById = async (
  id: string,
  userId: string
): Promise<Plan | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Omit<Plan, 'id'>;
  if (data.userId !== userId) return null;
  return { id: snapshot.id, ...data };
};

export const updatePlan = async (
  id: string,
  userId: string,
  input: UpdatePlanInput
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Plan not found or unauthorized');
  }

  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) throw new Error('Plan title cannot be empty.');
    updates.title = trimmed;
  }
  if (input.description !== undefined) {
    updates.description = input.description.trim();
  }
  if (input.category !== undefined) {
    updates.category = input.category;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }

  await updateDoc(docRef, updates);
};

export const deletePlan = async (id: string, userId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Plan not found or unauthorized');
  }

  // PRD requirement:
  // "When deleting a plan, remove its plan items while preserving preferences and memories."
  const itemsQuery = query(
    collection(db, 'planItems'),
    where('planId', '==', id),
    where('userId', '==', userId)
  );

  const itemsSnapshot = await getDocs(itemsQuery);
  const batch = writeBatch(db);

  itemsSnapshot.docs.forEach(itemDoc => {
    batch.delete(itemDoc.ref);
  });

  batch.delete(docRef);

  await batch.commit();
};
