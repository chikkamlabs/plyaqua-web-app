import { supabase } from './supabase';

export type CategoryStatus = 'active' | 'deactive';

export interface PartnerCategory {
  id: string;
  p_cat_id: string;
  name: string;
  status: CategoryStatus;
  image_url?: string | null;
  descripiton?: string | null;
  description?: string | null;
  points?: any;
  badge?: string | null;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_partner_categories_data';

const initialDemoCategories: PartnerCategory[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    p_cat_id: 'p_cat_101',
    name: 'Wholesale Distributors',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    descripiton: 'Large scale distribution partners handling bulk commercial inventory',
    description: 'Large scale distribution partners handling bulk commercial inventory',
    points: { tier: 'tier_1', reward_pct: 5, multiplier: 1.5 },
    badge: 'Gold Partner',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    p_cat_id: 'p_cat_102',
    name: 'Retail Supermarkets',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    descripiton: 'Brick and mortar retail outlets and regional grocery chains',
    description: 'Brick and mortar retail outlets and regional grocery chains',
    points: { tier: 'tier_2', reward_pct: 3, multiplier: 1.2 },
    badge: 'Silver Retailer',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    p_cat_id: 'p_cat_103',
    name: 'Corporate & Hospitality',
    status: 'deactive',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    descripiton: 'Hotels, resorts, and corporate enterprise water supply accounts',
    description: 'Hotels, resorts, and corporate enterprise water supply accounts',
    points: { tier: 'tier_3', reward_pct: 2, multiplier: 1.0 },
    badge: 'Bronze Enterprise',
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
  return `p_cat_₹{101 + currentLength}`;
}

/**
 * Upload partner category image to 'partner_catergory_images' bucket
 */
export async function uploadPartnerCategoryImage(
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const bucket = 'partner_catergory_images';
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `cat_₹{Date.now()}_₹{cleanFileName}`;

  if (isPlaceholderConfig()) {
    if (typeof window !== 'undefined') {
      return { url: URL.createObjectURL(file), error: null };
    }
    return {
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      error: null,
    };
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn(`Supabase storage upload error in ₹{bucket}:`, uploadError.message);
      if (typeof window !== 'undefined') {
        return { url: URL.createObjectURL(file), error: null };
      }
      return { url: null, error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err) {
    console.warn('Partner category image upload error, fallback to blob URL:', err);
    if (typeof window !== 'undefined') {
      return { url: URL.createObjectURL(file), error: null };
    }
    return {
      url: null,
      error: err instanceof Error ? err : new Error('Failed to upload category image'),
    };
  }
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
    const formatted: PartnerCategory[] = data.map((item, index) => {
      const desc = item.descripiton || item.description || null;
      return {
        id: item.id,
        p_cat_id: item.p_cat_id || calculateNextCategoryId(index),
        name: item.name,
        status: item.status as CategoryStatus,
        image_url: item.image_url || null,
        descripiton: desc,
        description: desc,
        points: item.points ?? null,
        badge: item.badge || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    setLocalCategories(formatted);
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
  image_url?: string | null;
  descripiton?: string | null;
  points?: any;
  badge?: string | null;
}): Promise<{
  data: PartnerCategory | null;
  error: Error | null;
}> {
  const current = getLocalCategories();
  const desc = categoryData.descripiton || null;
  const newLocalItem: PartnerCategory = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-₹{Date.now()}`,
    p_cat_id: categoryData.p_cat_id,
    name: categoryData.name,
    status: categoryData.status,
    image_url: categoryData.image_url || null,
    descripiton: desc,
    description: desc,
    points: categoryData.points ?? null,
    badge: categoryData.badge || null,
  };

  if (isPlaceholderConfig()) {
    const updated = [...current, newLocalItem];
    setLocalCategories(updated);
    return { data: newLocalItem, error: null };
  }

  try {
    // Attempt full insert with all columns
    const payload: Record<string, any> = {
      p_cat_id: categoryData.p_cat_id,
      name: categoryData.name,
      status: categoryData.status,
      image_url: categoryData.image_url || null,
      descripiton: desc,
      points: categoryData.points ?? null,
      badge: categoryData.badge || null,
    };

    let result = await supabase
      .from('partner_categories')
      .insert(payload)
      .select()
      .single();

    // If specific new columns are not yet in DB schema, attempt fallback
    if (result.error) {
      console.warn('Supabase partner category insert error, retrying without optional fields:', result.error.message);
      result = await supabase
        .from('partner_categories')
        .insert({
          p_cat_id: categoryData.p_cat_id,
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
      image_url: result.data.image_url || categoryData.image_url || null,
      descripiton: result.data.descripiton || desc,
      description: result.data.descripiton || desc,
      points: result.data.points ?? categoryData.points ?? null,
      badge: result.data.badge || categoryData.badge || null,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
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
 * Update an existing partner category (allow editing all fields, keeping p_cat_id immutable)
 */
export async function updatePartnerCategory(
  id: string,
  updates: {
    name: string;
    status: CategoryStatus;
    image_url?: string | null;
    descripiton?: string | null;
    points?: any;
    badge?: string | null;
  }
): Promise<{
  data: PartnerCategory | null;
  error: Error | null;
}> {
  const current = getLocalCategories();
  const localIndex = current.findIndex((c) => c.id === id);
  const desc = updates.descripiton !== undefined ? updates.descripiton : (localIndex !== -1 ? current[localIndex].descripiton : null);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        name: updates.name,
        status: updates.status,
        image_url: updates.image_url !== undefined ? updates.image_url : current[localIndex].image_url,
        descripiton: desc,
        description: desc,
        points: updates.points !== undefined ? updates.points : current[localIndex].points,
        badge: updates.badge !== undefined ? updates.badge : current[localIndex].badge,
      };
      setLocalCategories(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Category not found') };
  }

  try {
    const updatePayload: Record<string, any> = {
      name: updates.name,
      status: updates.status,
    };
    if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url;
    if (updates.descripiton !== undefined) updatePayload.descripiton = updates.descripiton;
    if (updates.points !== undefined) updatePayload.points = updates.points;
    if (updates.badge !== undefined) updatePayload.badge = updates.badge;

    const { data, error } = await supabase
      .from('partner_categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (localIndex !== -1) {
        current[localIndex] = {
          ...current[localIndex],
          name: updates.name,
          status: updates.status,
          image_url: updates.image_url !== undefined ? updates.image_url : current[localIndex].image_url,
          descripiton: desc,
          description: desc,
          points: updates.points !== undefined ? updates.points : current[localIndex].points,
          badge: updates.badge !== undefined ? updates.badge : current[localIndex].badge,
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
      image_url: data.image_url || null,
      descripiton: data.descripiton || null,
      description: data.descripiton || null,
      points: data.points ?? null,
      badge: data.badge || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
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
