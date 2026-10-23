import { supabase } from './supabase';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  available_points: number;
  key: string | null;
  total_points: number;
  total_cashback: number;
  created_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_customers_data';

const initialDemoCustomers: Customer[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Alex Morgan',
    mobile: '+1 (555) 345-6789',
    available_points: 350,
    key: 'CUST-KEY-101',
    total_points: 500,
    total_cashback: 25.0,
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Samantha Reed',
    mobile: '+1 (555) 987-6543',
    available_points: 120,
    key: 'CUST-KEY-102',
    total_points: 200,
    total_cashback: 10.0,
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Marcus Chen',
    mobile: '+1 (555) 456-7890',
    available_points: 840,
    key: 'CUST-KEY-103',
    total_points: 1100,
    total_cashback: 65.5,
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    name: 'Elena Rostova',
    mobile: '+1 (555) 567-8901',
    available_points: 620,
    key: 'CUST-KEY-104',
    total_points: 850,
    total_cashback: 40.0,
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

const getLocalCustomers = (): Customer[] => {
  if (typeof window === 'undefined') return initialDemoCustomers;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoCustomers));
    return initialDemoCustomers;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoCustomers;
  }
};

const setLocalCustomers = (customers: Customer[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customers));
};

/**
 * Fetch all customers from Supabase (or demo storage)
 */
export async function getCustomers(): Promise<{
  data: Customer[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    return { data: getLocalCustomers(), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase customers query error, falling back to local storage:', error.message);
      return { data: getLocalCustomers(), error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const formatted: Customer[] = data.map((c) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      available_points: c.available_points || 0,
      key: c.key || null,
      total_points: c.total_points || 0,
      total_cashback: Number(c.total_cashback) || 0.0,
      created_at: c.created_at,
    }));

    setLocalCustomers(formatted);
    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalCustomers(),
      error: err instanceof Error ? err : new Error('Failed to fetch customers'),
    };
  }
}

/**
 * Fetch a single customer by ID
 */
export async function getCustomerById(id: string): Promise<{
  data: Customer | null;
  error: Error | null;
}> {
  const { data: customers, error } = await getCustomers();
  if (error) {
    return { data: null, error };
  }
  const found = customers.find((c) => c.id === id);
  if (!found) {
    return { data: null, error: new Error('Customer not found') };
  }
  return { data: found, error: null };
}

/**
 * Update all customer fields in public.customers table
 */
export async function updateCustomer(
  id: string,
  updates: {
    name: string;
    mobile: string;
    available_points: number;
    key: string | null;
    total_points: number;
    total_cashback: number;
  }
): Promise<{
  data: Customer | null;
  error: Error | null;
}> {
  const current = getLocalCustomers();
  const localIndex = current.findIndex((c) => c.id === id);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
      };
      setLocalCustomers(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Customer not found') };
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        mobile: updates.mobile,
        available_points: Number(updates.available_points) || 0,
        key: updates.key || null,
        total_points: Number(updates.total_points) || 0,
        total_cashback: Number(updates.total_cashback) || 0.0,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (localIndex !== -1) {
        current[localIndex] = {
          ...current[localIndex],
          ...updates,
        };
        setLocalCustomers(current);
        return { data: current[localIndex], error: null };
      }
      return { data: null, error: new Error(error.message) };
    }

    const updatedCustomer: Customer = {
      id: data.id,
      name: data.name,
      mobile: data.mobile,
      available_points: data.available_points || 0,
      key: data.key || null,
      total_points: data.total_points || 0,
      total_cashback: Number(data.total_cashback) || 0.0,
    };

    if (localIndex !== -1) {
      current[localIndex] = updatedCustomer;
      setLocalCustomers(current);
    }

    return { data: updatedCustomer, error: null };
  } catch (err: unknown) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
      };
      setLocalCustomers(current);
      return { data: current[localIndex], error: null };
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update customer'),
    };
  }
}
