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
import type { Category, Preference, PreferenceImportance, PreferenceStatus } from '../types';
import { db } from './firebase';

const COLLECTION_NAME = 'preferences';

export interface CreatePreferenceInput {
  userId: string;
  title: string;
  description: string;
  category: Category | string;
  importance: PreferenceImportance;
  status?: PreferenceStatus;
  supportingMemoryIds?: string[];
}

export interface UpdatePreferenceInput {
  title?: string;
  description?: string;
  category?: Category | string;
  importance?: PreferenceImportance;
  status?: PreferenceStatus;
  supportingMemoryIds?: string[];
}

export const createPreference = async (input: CreatePreferenceInput): Promise<string> => {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    throw new Error('Preference title is required.');
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId: input.userId,
    title: trimmedTitle,
    description: (input.description || '').trim(),
    category: input.category || 'Other',
    importance: input.importance || 'medium',
    status: input.status || 'active',
    supportingMemoryIds: input.supportingMemoryIds || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getPreferences = async (
  userId: string,
  options?: {
    status?: PreferenceStatus;
    category?: string;
    importance?: PreferenceImportance;
    maxResults?: number;
  }
): Promise<Preference[]> => {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    limit(options?.maxResults || 200)
  );

  const snapshot = await getDocs(q);
  let preferences = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Preference, 'id'>),
  }));

  preferences.sort((a, b) => {
    const aTime = (a.updatedAt as Timestamp)?.toMillis?.() || 0;
    const bTime = (b.updatedAt as Timestamp)?.toMillis?.() || 0;
    return bTime - aTime;
  });

  if (options?.status) {
    preferences = preferences.filter(p => p.status === options.status);
  }

  if (options?.category) {
    preferences = preferences.filter(p => p.category === options.category);
  }

  if (options?.importance) {
    preferences = preferences.filter(p => p.importance === options.importance);
  }

  return preferences;
};

export const getPreferenceById = async (
  id: string,
  userId: string
): Promise<Preference | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Omit<Preference, 'id'>;
  if (data.userId !== userId) return null;
  return { id: snapshot.id, ...data };
};

export const updatePreference = async (
  id: string,
  userId: string,
  input: UpdatePreferenceInput
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Preference not found or unauthorized');
  }

  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) throw new Error('Preference title cannot be empty.');
    updates.title = trimmed;
  }
  if (input.description !== undefined) {
    updates.description = input.description.trim();
  }
  if (input.category !== undefined) {
    updates.category = input.category;
  }
  if (input.importance !== undefined) {
    updates.importance = input.importance;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }
  if (input.supportingMemoryIds !== undefined) {
    updates.supportingMemoryIds = Array.from(new Set(input.supportingMemoryIds));
  }

  await updateDoc(docRef, updates);
};

export const deletePreference = async (id: string, userId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Preference not found or unauthorized');
  }

  // Also clean up any planItems that associate this preference with plans
  const planItemsQuery = query(
    collection(db, 'planItems'),
    where('userId', '==', userId),
    where('preferenceId', '==', id)
  );
  const planItemsSnap = await getDocs(planItemsQuery);

  const batch = writeBatch(db);
  planItemsSnap.docs.forEach(itemDoc => {
    batch.delete(itemDoc.ref);
  });
  batch.delete(docRef);

  await batch.commit();
};

export const getPreferencesSupportingMemory = async (
  memoryId: string,
  userId: string
): Promise<Preference[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('supportingMemoryIds', 'array-contains', memoryId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Preference, 'id'>),
  }));
};
