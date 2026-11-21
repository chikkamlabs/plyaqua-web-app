import { supabase } from './supabase';

export type DistributorStatus = 'active' | 'deactive';

export interface Distributor {
  id: string;
  name: string;
  mobile: string;
  city: string;
  address: string;
  points: number;
  notes: string;
  status: DistributorStatus;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_distributors_data';

const initialDemoDistributors: Distributor[] = [
  {
    id: '77777777-7777-7777-7777-777777777701',
    name: 'Oceanic Beverage Distributors',
    mobile: '+1 (555) 210-3456',
    city: 'Riverdale',
    address: '120 Harbor Logistics Park, Riverdale',
    points: 1500,
    notes: 'Primary regional hub distributor',
    status: 'active',
  },
  {
    id: '77777777-7777-7777-7777-777777777702',
    name: 'Crystal Spring Supply Co.',
    mobile: '+1 (555) 789-4321',
    city: 'Metro City',
    address: '45 Industrial Ave, Metro City',
    points: 850,
    notes: 'Covers downtown commercial zone',
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

const getLocalDistributors = (): Distributor[] => {
  if (typeof window === 'undefined') return initialDemoDistributors;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoDistributors));
    return initialDemoDistributors;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoDistributors;
  }
};

const setLocalDistributors = (distributors: Distributor[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(distributors));
};

/**
 * Fetch all distributors from public.distributors_profile
 */
export async function getDistributors(): Promise<{
  data: Distributor[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    return { data: getLocalDistributors(), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('distributors_profile')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase distributors_profile fetch error, using local fallback:', error.message);
      return { data: getLocalDistributors(), error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const formatted: Distributor[] = data.map((d) => ({
      id: d.id,
      name: d.name || '',
      mobile: d.mobile || '',
      city: d.city || '',
      address: d.address || '',
      points: Number(d.points) || 0,
      notes: d.notes || '',
      status: (d.status as DistributorStatus) || 'active',
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    setLocalDistributors(formatted);
    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalDistributors(),
      error: err instanceof Error ? err : new Error('Failed to fetch distributors'),
    };
  }
}

/**
 * Create a new distributor in public.distributors_profile
 */
export async function createDistributor(params: {
  name: string;
  mobile: string;
  city: string;
  address: string;
  points: number;
  notes: string;
  status: DistributorStatus;
}): Promise<{
  data: Distributor | null;
  error: Error | null;
}> {
  const current = getLocalDistributors();
  const nowIso = new Date().toISOString();
  const newLocalDistributor: Distributor = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-dist-${Date.now()}`,
    name: params.name.trim(),
    mobile: params.mobile.trim(),
    city: params.city.trim(),
    address: params.address.trim(),
    points: Number(params.points) || 0,
    notes: params.notes.trim(),
    status: params.status || 'active',
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (isPlaceholderConfig()) {
    const updated = [newLocalDistributor, ...current];
    setLocalDistributors(updated);
    return { data: newLocalDistributor, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('distributors_profile')
      .insert({
        name: params.name.trim(),
        mobile: params.mobile.trim(),
        city: params.city.trim() || null,
        address: params.address.trim() || null,
        points: Number(params.points) || 0,
        notes: params.notes.trim() || null,
        status: params.status || 'active',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const created: Distributor = {
      id: data.id,
      name: data.name || '',
      mobile: data.mobile || '',
      city: data.city || '',
      address: data.address || '',
      points: Number(data.points) || 0,
      notes: data.notes || '',
      status: (data.status as DistributorStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    setLocalDistributors([created, ...current]);
    return { data: created, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create distributor'),
    };
  }
}

/**
 * Update an existing distributor in public.distributors_profile
 */
export async function updateDistributor(
  id: string,
  updates: {
    name: string;
    mobile: string;
    city: string;
    address: string;
    points: number;
    notes: string;
    status: DistributorStatus;
  }
): Promise<{
  data: Distributor | null;
  error: Error | null;
}> {
  const current = getLocalDistributors();
  const localIndex = current.findIndex((d) => d.id === id);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        name: updates.name.trim(),
        mobile: updates.mobile.trim(),
        city: updates.city.trim(),
        address: updates.address.trim(),
        points: Number(updates.points) || 0,
        notes: updates.notes.trim(),
        status: updates.status,
        updated_at: new Date().toISOString(),
      };
      setLocalDistributors(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Distributor not found') };
  }

  try {
    const { data, error } = await supabase
      .from('distributors_profile')
      .update({
        name: updates.name.trim(),
        mobile: updates.mobile.trim(),
        city: updates.city.trim() || null,
        address: updates.address.trim() || null,
        points: Number(updates.points) || 0,
        notes: updates.notes.trim() || null,
        status: updates.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const updatedDistributor: Distributor = {
      id: data.id,
      name: data.name || '',
      mobile: data.mobile || '',
      city: data.city || '',
      address: data.address || '',
      points: Number(data.points) || 0,
      notes: data.notes || '',
      status: (data.status as DistributorStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    if (localIndex !== -1) {
      current[localIndex] = updatedDistributor;
      setLocalDistributors(current);
    }

    return { data: updatedDistributor, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update distributor'),
    };
  }
}
