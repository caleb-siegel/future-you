import { Timestamp } from 'firebase/firestore';

export type Category =
  | 'Home'
  | 'Travel'
  | 'Relationships'
  | 'Family'
  | 'Career'
  | 'Money'
  | 'Health & Fitness'
  | 'Lifestyle'
  | 'Purchases'
  | 'Personal Growth'
  | 'Car'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Home',
  'Travel',
  'Relationships',
  'Family',
  'Career',
  'Money',
  'Health & Fitness',
  'Lifestyle',
  'Purchases',
  'Personal Growth',
  'Car',
  'Other',
];

export interface Memory {
  id: string;
  userId: string;
  content: string;
  category: Category | string | null;
  tags: string[];
  people?: string[];
  location?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PreferenceImportance = 'must_have' | 'high' | 'medium' | 'low';
export type PreferenceStatus = 'active' | 'reconsider' | 'archived';

export interface Preference {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: Category | string;
  importance: PreferenceImportance;
  status: PreferenceStatus;
  supportingMemoryIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PlanStatus = 'active' | 'completed' | 'archived';

export interface Plan {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: Category | string;
  status: PlanStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlanItem {
  id: string;
  userId: string;
  planId: string;
  preferenceId: string;
  importance: PreferenceImportance;
  notes: string;
  checked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlanItemWithPreference extends PlanItem {
  preference?: Preference;
  supportingMemories?: Memory[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
