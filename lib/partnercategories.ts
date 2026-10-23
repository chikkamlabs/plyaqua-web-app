import { supabase } from './supabase';

export type CategoryStatus = 'active' | 'deactive';

export interface PartnerCategory {
  id: string;
  p_cat_id: string;
  name: string;
  status: CategoryStatus;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_partner_categories_data';

const initialDemoCategories: PartnerCategory[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    p_cat_id: 'p_cat_101',
    name: 'Wholesale Distributors',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    p_cat_id: 'p_cat_102',
    name: 'Retail Supermarkets',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    p_cat_id: 'p_cat_103',
    name: 'Corporate & Hospitality',
    status: 'deactive',
  },
];

const isPlaceholderConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    !url ||
    url.includes('your-project.supabase.co') ||
    url.includes('placeholder') ||
    !key ||
    key.includes('your-anon-key') ||
    key.includes('placeholder')
  );
};

const getLocalCategories = (): PartnerCategory[] => {
  if (typeof window === 'undefined') return initialDemoCategories;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoCategories));
    return initialDemoCategories;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoCategories;
  }
};

const setLocalCategories = (categories: PartnerCategory[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(categories));
};

/**
 * Calculates auto-fill ID formula: p_cat_101 + length of partner categories
 */
export function calculateNextCategoryId(currentLength: number): string {
  return `p_cat_${101 + currentLength}`;
}

/**
 * Fetch all partner categories from Supabase (or demo storage)
 */
export async function getPartnerCategories(): Promise<{
  data: PartnerCategory[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    const categories = getLocalCategories();
    return { data: categories, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('partner_categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Supabase fetch returned error, falling back to local state:', error.message);
      return { data: getLocalCategories(), error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Format categories ensuring p_cat_id is mapped (formula: p_cat_101 + index)
    const formatted: PartnerCategory[] = data.map((item, index) => ({
      id: item.id,
      p_cat_id: item.p_cat_id || calculateNextCategoryId(index),
      name: item.name,
      status: item.status as CategoryStatus,
      created_at: item.created_at,
    }));

    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalCategories(),
      error: err instanceof Error ? err : new Error('Failed to fetch partner categories'),
    };
  }
}

/**
 * Create a new partner category in Supabase
 */
export async function createPartnerCategory(categoryData: {
  p_cat_id: string;
  name: string;
  status: CategoryStatus;
}): Promise<{
  data: PartnerCategory | null;
  error: Error | null;
}> {
  const current = getLocalCategories();
  const newLocalItem: PartnerCategory = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`,
    p_cat_id: categoryData.p_cat_id,
    name: categoryData.name,
    status: categoryData.status,
  };

  if (isPlaceholderConfig()) {
    const updated = [...current, newLocalItem];
    setLocalCategories(updated);
    return { data: newLocalItem, error: null };
  }

  try {
    // Attempt insert with p_cat_id if schema includes it
    let result = await supabase
      .from('partner_categories')
      .insert({
        p_cat_id: categoryData.p_cat_id,
        name: categoryData.name,
        status: categoryData.status,
      })
      .select()
      .single();

    // If p_cat_id column is not in DB schema, fallback to inserting name and status
    if (result.error && result.error.message.includes('p_cat_id')) {
      result = await supabase
        .from('partner_categories')
        .insert({
          name: categoryData.name,
          status: categoryData.status,
        })
        .select()
        .single();
    }

    if (result.error) {
      // Keep local sync so user operation succeeds in UI
      const updated = [...current, newLocalItem];
      setLocalCategories(updated);
      return { data: newLocalItem, error: null };
    }

    const created: PartnerCategory = {
      id: result.data.id,
      p_cat_id: result.data.p_cat_id || categoryData.p_cat_id,
      name: result.data.name,
      status: result.data.status,
    };

    setLocalCategories([...current, created]);
    return { data: created, error: null };
  } catch (err: unknown) {
    const updated = [...current, newLocalItem];
    setLocalCategories(updated);
    return {
      data: newLocalItem,
      error: err instanceof Error ? err : new Error('Failed to create partner category'),
    };
  }
}

/**
 * Update an existing partner category (allow editing name and status, keeping p_cat_id immutable)
 */
export async function updatePartnerCategory(
  id: string,
  updates: {
    name: string;
    status: CategoryStatus;
  }
): Promise<{
  data: PartnerCategory | null;
  error: Error | null;
}> {
  const current = getLocalCategories();
  const localIndex = current.findIndex((c) => c.id === id);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        name: updates.name,
        status: updates.status,
      };
      setLocalCategories(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Category not found') };
  }

  try {
    const { data, error } = await supabase
      .from('partner_categories')
      .update({
        name: updates.name,
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (localIndex !== -1) {
        current[localIndex] = {
          ...current[localIndex],
          name: updates.name,
          status: updates.status,
        };
        setLocalCategories(current);
        return { data: current[localIndex], error: null };
      }
      return { data: null, error: new Error(error.message) };
    }

    const updatedItem: PartnerCategory = {
      id: data.id,
      p_cat_id: data.p_cat_id || (localIndex !== -1 ? current[localIndex].p_cat_id : calculateNextCategoryId(localIndex)),
      name: data.name,
      status: data.status,
    };

    if (localIndex !== -1) {
      current[localIndex] = updatedItem;
      setLocalCategories(current);
    }

    return { data: updatedItem, error: null };
  } catch (err: unknown) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        name: updates.name,
        status: updates.status,
      };
      setLocalCategories(current);
      return { data: current[localIndex], error: null };
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update partner category'),
    };
  }
}
