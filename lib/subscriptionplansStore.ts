import { supabase } from './supabase';

export type SubscriptionPlanStatus = 'active' | 'deactive';

export interface SubscriptionPlan {
  id: string;
  name: string;
  actual_price: number;
  selling_price: number;
  includes: unknown;
  image_url: string | null;
  status: SubscriptionPlanStatus;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_subscription_plans_data';

const initialDemoPlans: SubscriptionPlan[] = [
  {
    id: '88888888-8888-8888-8888-888888888801',
    name: 'Monthly Pure Hydration Plan',
    actual_price: 999.0,
    selling_price: 799.0,
    includes: ['15 x 20L Water Jars', 'Free Doorstep Delivery', 'Free Dispenser Sanitization'],
    image_url: null,
    status: 'active',
  },
  {
    id: '88888888-8888-8888-8888-888888888802',
    name: 'Corporate Office Plan',
    actual_price: 2999.0,
    selling_price: 2499.0,
    includes: ['50 x 20L Water Jars', 'Priority Morning Delivery', '2 Free Dispensers'],
    image_url: null,
    status: 'active',
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

const getLocalPlans = (): SubscriptionPlan[] => {
  if (typeof window === 'undefined') return initialDemoPlans;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoPlans));
    return initialDemoPlans;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoPlans;
  }
};

const setLocalPlans = (plans: SubscriptionPlan[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
};

/**
 * Upload subscription plan image to the 'subscription_plans_bucket' storage bucket
 */
export async function uploadSubscriptionPlanImage(
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const bucket = 'subscription_plans_bucket';
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `plan_${Date.now()}_${cleanFileName}`;

  if (isPlaceholderConfig()) {
    if (typeof window !== 'undefined') {
      return { url: URL.createObjectURL(file), error: null };
    }
    return { url: null, error: new Error('Supabase storage is not configured') };
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: unknown) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error('Failed to upload subscription plan image'),
    };
  }
}

/**
 * Fetch all subscription plans from public.subscription_plans
 */
export async function getSubscriptionPlans(): Promise<{
  data: SubscriptionPlan[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    return { data: getLocalPlans(), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase subscription_plans fetch error, using local fallback:', error.message);
      return { data: getLocalPlans(), error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const formatted: SubscriptionPlan[] = data.map((p) => ({
      id: p.id,
      name: p.name || '',
      actual_price: Number(p.actual_price ?? p.Actual_price ?? 0) || 0,
      selling_price: Number(p.selling_price ?? 0) || 0,
      includes: p.includes ?? [],
      image_url: p.image_url || null,
      status: (p.status as SubscriptionPlanStatus) || 'active',
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    setLocalPlans(formatted);
    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalPlans(),
      error: err instanceof Error ? err : new Error('Failed to fetch subscription plans'),
    };
  }
}

/**
 * Create a new subscription plan in public.subscription_plans
 */
export async function createSubscriptionPlan(params: {
  name: string;
  actual_price: number;
  selling_price: number;
  includes: unknown;
  image_url?: string | null;
  status: SubscriptionPlanStatus;
}): Promise<{
  data: SubscriptionPlan | null;
  error: Error | null;
}> {
  const current = getLocalPlans();
  const nowIso = new Date().toISOString();
  const newLocalPlan: SubscriptionPlan = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-plan-${Date.now()}`,
    name: params.name.trim(),
    actual_price: Number(params.actual_price) || 0,
    selling_price: Number(params.selling_price) || 0,
    includes: params.includes ?? [],
    image_url: params.image_url || null,
    status: params.status || 'active',
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (isPlaceholderConfig()) {
    const updated = [newLocalPlan, ...current];
    setLocalPlans(updated);
    return { data: newLocalPlan, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        name: params.name.trim(),
        actual_price: Number(params.actual_price) || 0,
        selling_price: Number(params.selling_price) || 0,
        includes: params.includes ?? [],
        image_url: params.image_url || null,
        status: params.status || 'active',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const created: SubscriptionPlan = {
      id: data.id,
      name: data.name || '',
      actual_price: Number(data.actual_price ?? data.Actual_price ?? 0) || 0,
      selling_price: Number(data.selling_price ?? 0) || 0,
      includes: data.includes ?? [],
      image_url: data.image_url || null,
      status: (data.status as SubscriptionPlanStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    setLocalPlans([created, ...current]);
    return { data: created, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create subscription plan'),
    };
  }
}

/**
 * Update an existing subscription plan in public.subscription_plans
 */
export async function updateSubscriptionPlan(
  id: string,
  updates: {
    name: string;
    actual_price: number;
    selling_price: number;
    includes: unknown;
    image_url?: string | null;
    status: SubscriptionPlanStatus;
  }
): Promise<{
  data: SubscriptionPlan | null;
  error: Error | null;
}> {
  const current = getLocalPlans();
  const localIndex = current.findIndex((p) => p.id === id);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        name: updates.name.trim(),
        actual_price: Number(updates.actual_price) || 0,
        selling_price: Number(updates.selling_price) || 0,
        includes: updates.includes ?? [],
        image_url: updates.image_url !== undefined ? updates.image_url : current[localIndex].image_url,
        status: updates.status,
        updated_at: new Date().toISOString(),
      };
      setLocalPlans(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Subscription plan not found') };
  }

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        name: updates.name.trim(),
        actual_price: Number(updates.actual_price) || 0,
        selling_price: Number(updates.selling_price) || 0,
        includes: updates.includes ?? [],
        image_url: updates.image_url,
        status: updates.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const updatedPlan: SubscriptionPlan = {
      id: data.id,
      name: data.name || '',
      actual_price: Number(data.actual_price ?? data.Actual_price ?? 0) || 0,
      selling_price: Number(data.selling_price ?? 0) || 0,
      includes: data.includes ?? [],
      image_url: data.image_url || null,
      status: (data.status as SubscriptionPlanStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    if (localIndex !== -1) {
      current[localIndex] = updatedPlan;
      setLocalPlans(current);
    }

    return { data: updatedPlan, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update subscription plan'),
    };
  }
}
