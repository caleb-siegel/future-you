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
import type { Category, Memory } from '../types';
import { db } from './firebase';

const COLLECTION_NAME = 'memories';

export interface CreateMemoryInput {
  userId: string;
  content: string;
  category?: Category | string | null;
  tags?: string[];
  people?: string[];
  location?: string;
}

export interface UpdateMemoryInput {
  content?: string;
  category?: Category | string | null;
  tags?: string[];
  people?: string[];
  location?: string;
}

export const createMemory = async (input: CreateMemoryInput): Promise<string> => {
  const trimmed = input.content.trim();
  if (!trimmed) {
    throw new Error('Memory content cannot be empty.');
  }
  if (trimmed.length > 10000) {
    throw new Error('Memory content exceeds the 10,000 character limit.');
  }

  const cleanTags = (input.tags || [])
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    userId: input.userId,
    content: trimmed,
    category: input.category || null,
    tags: Array.from(new Set(cleanTags)),
    people: input.people || [],
    location: input.location?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getMemories = async (
  userId: string,
  maxResults = 100
): Promise<Memory[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Memory, 'id'>),
  }));
};

export const getMemoryById = async (
  id: string,
  userId: string
): Promise<Memory | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Omit<Memory, 'id'>;
  if (data.userId !== userId) return null;
  return { id: snapshot.id, ...data };
};

export const updateMemory = async (
  id: string,
  userId: string,
  input: UpdateMemoryInput
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Memory not found or unauthorized');
  }

  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (input.content !== undefined) {
    const trimmed = input.content.trim();
    if (!trimmed) {
      throw new Error('Memory content cannot be empty.');
    }
    if (trimmed.length > 10000) {
      throw new Error('Memory content exceeds the 10,000 character limit.');
    }
    updates.content = trimmed;
  }

  if (input.category !== undefined) {
    updates.category = input.category || null;
  }

  if (input.tags !== undefined) {
    const cleanTags = input.tags
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);
    updates.tags = Array.from(new Set(cleanTags));
  }

  if (input.people !== undefined) {
    updates.people = input.people;
  }

  if (input.location !== undefined) {
    updates.location = input.location.trim() || null;
  }

  await updateDoc(docRef, updates);
};

export const deleteMemory = async (id: string, userId: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const existing = await getDoc(docRef);
  if (!existing.exists() || existing.data()?.userId !== userId) {
    throw new Error('Memory not found or unauthorized');
  }

  // PRD requirement:
  // "When deleting a memory, ensure it no longer appears as supporting evidence for preferences. Preserve those preferences."
  // Find all preferences where supportingMemoryIds contains id
  const prefsQuery = query(
    collection(db, 'preferences'),
    where('userId', '==', userId),
    where('supportingMemoryIds', 'array-contains', id)
  );

  const prefsSnapshot = await getDocs(prefsQuery);
  const batch = writeBatch(db);

  prefsSnapshot.docs.forEach(prefDoc => {
    const currentList: string[] = prefDoc.data().supportingMemoryIds || [];
    const updatedList = currentList.filter(memId => memId !== id);
    batch.update(prefDoc.ref, {
      supportingMemoryIds: updatedList,
      updatedAt: serverTimestamp(),
    });
  });

  // Delete the memory document itself
  batch.delete(docRef);

  await batch.commit();
};

export const searchAndFilterMemories = (
  memories: Memory[],
  options: {
    searchTerm?: string;
    category?: string | null;
    tag?: string | null;
    sortOrder?: 'newest' | 'oldest';
  }
): Memory[] => {
  let result = [...memories];

  if (options.category) {
    if (options.category === 'Uncategorized') {
      result = result.filter(m => !m.category);
    } else {
      result = result.filter(m => m.category === options.category);
    }
  }

  if (options.tag) {
    const queryTag = options.tag.toLowerCase();
    result = result.filter(m => m.tags.some(t => t.toLowerCase() === queryTag));
  }

  if (options.searchTerm && options.searchTerm.trim()) {
    const term = options.searchTerm.trim().toLowerCase();
    result = result.filter(m => {
      const matchContent = m.content.toLowerCase().includes(term);
      const matchTags = m.tags.some(t => t.toLowerCase().includes(term));
      const matchCategory = m.category?.toLowerCase().includes(term);
      const matchLocation = m.location?.toLowerCase().includes(term);
      const matchPeople = m.people?.some(p => p.toLowerCase().includes(term));
      return matchContent || matchTags || matchCategory || matchLocation || matchPeople;
    });
  }

  if (options.sortOrder === 'oldest') {
    result.sort((a, b) => {
      const aTime = (a.createdAt as Timestamp)?.toMillis?.() || 0;
      const bTime = (b.createdAt as Timestamp)?.toMillis?.() || 0;
      return aTime - bTime;
    });
  } else {
    // Newest first by default
    result.sort((a, b) => {
      const aTime = (a.createdAt as Timestamp)?.toMillis?.() || 0;
      const bTime = (b.createdAt as Timestamp)?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }

  return result;
};
