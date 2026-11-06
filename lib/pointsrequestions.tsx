import { supabase } from './supabase';

export type CuspntreqStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';

export interface CustomerPointReq {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_mobile?: string;
  points: number;
  notes?: string | null;
  status: CuspntreqStatus;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_customer_points_reqs_data';

export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `₹{year}-₹{month}-₹{day}`;
}

const initialDemoRequests: CustomerPointReq[] = [
  {
    id: 'cpr-001',
    customer_id: '33333333-3333-3333-3333-333333333301',
    customer_name: 'Alex Morgan',
    customer_mobile: '+1 (555) 345-6789',
    points: 150,
    notes: 'Requested discount voucher for store pickup',
    status: 'pending',
    created_at: `₹{formatDateYMD(new Date())}T09:15:00.000Z`,
    updated_at: `₹{formatDateYMD(new Date())}T09:15:00.000Z`,
  },
  {
    id: 'cpr-002',
    customer_id: '33333333-3333-3333-3333-333333333302',
    customer_name: 'Samantha Reed',
    customer_mobile: '+1 (555) 987-6543',
    points: 80,
    notes: 'Reward redemption for free bottle cooler tote',
    status: 'processing',
    created_at: `₹{formatDateYMD(new Date())}T10:45:00.000Z`,
    updated_at: `₹{formatDateYMD(new Date())}T11:00:00.000Z`,
  },
  {
    id: 'cpr-003',
    customer_id: '33333333-3333-3333-3333-333333333303',
    customer_name: 'Marcus Chen',
    customer_mobile: '+1 (555) 456-7890',
    points: 300,
    notes: 'Cashback points conversion approved',
    status: 'completed',
    created_at: `₹{formatDateYMD(new Date())}T08:30:00.000Z`,
    updated_at: `₹{formatDateYMD(new Date())}T08:45:00.000Z`,
  },
  {
    id: 'cpr-004',
    customer_id: '33333333-3333-3333-3333-333333333304',
    customer_name: 'Elena Rostova',
    customer_mobile: '+1 (555) 567-8901',
    points: 250,
    notes: 'Insufficient points verification check',
    status: 'rejected',
    created_at: `₹{formatDateYMD(new Date(Date.now() - 86400000))}T14:20:00.000Z`,
    updated_at: `₹{formatDateYMD(new Date(Date.now() - 86400000))}T15:10:00.000Z`,
  },
  {
    id: 'cpr-005',
    customer_id: '33333333-3333-3333-3333-333333333301',
    customer_name: 'Alex Morgan',
    customer_mobile: '+1 (555) 345-6789',
    points: 50,
    notes: 'Customer cancelled prior to dispatch',
    status: 'cancelled',
    created_at: `₹{formatDateYMD(new Date(Date.now() - 86400000 * 2))}T11:05:00.000Z`,
    updated_at: `₹{formatDateYMD(new Date(Date.now() - 86400000 * 2))}T11:30:00.000Z`,
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

const getLocalRequests = (): CustomerPointReq[] => {
  if (typeof window === 'undefined') return initialDemoRequests;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoRequests));
    return initialDemoRequests;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoRequests;
  }
};

const setLocalRequests = (requests: CustomerPointReq[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
};

export interface PointReqFilters {
  status?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  mobile?: string;
}

/**
 * Fetch all customer points requests with optional filters
 */
export async function getCustomerPointReqs(filters?: PointReqFilters): Promise<{
  data: CustomerPointReq[];
  totalFilteredCount: number;
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalRequests();

    if (filters?.fromDate) {
      list = list.filter((r) => {
        const itemDate = r.created_at.split('T')[0];
        return itemDate >= filters.fromDate!;
      });
    }

    if (filters?.toDate) {
      list = list.filter((r) => {
        const itemDate = r.created_at.split('T')[0];
        return itemDate <= filters.toDate!;
      });
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((r) => r.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters?.mobile && filters.mobile.trim()) {
      const query = filters.mobile.trim().toLowerCase();
      list = list.filter((r) => (r.customer_mobile || '').toLowerCase().includes(query));
    }

    return {
      data: list,
      totalFilteredCount: list.length,
      error: null,
    };
  }

  try {
    let query = supabase
      .from('customer_points_reqs')
      .select(`
        id,
        customer_id,
        points,
        notes,
        status,
        created_at,
        updated_at,
        customer:customers (
          id,
          name,
          mobile
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      query = query.gte('created_at', `₹{filters.fromDate}T00:00:00.000Z`);
    }

    if (filters?.toDate) {
      query = query.lte('created_at', `₹{filters.toDate}T23:59:59.999Z`);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase customer_points_reqs query error, falling back to local demo:', error.message);
      let list = getLocalRequests();

      if (filters?.fromDate) {
        list = list.filter((r) => r.created_at.split('T')[0] >= filters.fromDate!);
      }
      if (filters?.toDate) {
        list = list.filter((r) => r.created_at.split('T')[0] <= filters.toDate!);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((r) => r.status.toLowerCase() === filters.status!.toLowerCase());
      }
      if (filters?.mobile && filters.mobile.trim()) {
        const q = filters.mobile.trim().toLowerCase();
        list = list.filter((r) => (r.customer_mobile || '').toLowerCase().includes(q));
      }

      return {
        data: list,
        totalFilteredCount: list.length,
        error: null,
      };
    }

    // Map rows and apply client-side mobile search if needed
    let mapped: CustomerPointReq[] = (data || []).map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      customer_name: row.customer?.name || 'Customer',
      customer_mobile: row.customer?.mobile || '',
      points: Number(row.points) || 0,
      notes: row.notes || '',
      status: row.status as CuspntreqStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (filters?.mobile && filters.mobile.trim()) {
      const q = filters.mobile.trim().toLowerCase();
      mapped = mapped.filter((r) => (r.customer_mobile || '').toLowerCase().includes(q));
    }

    return {
      data: mapped,
      totalFilteredCount: mapped.length,
      error: null,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Failed to fetch customer points requests');
    return { data: [], totalFilteredCount: 0, error };
  }
}

/**
 * Updates a customer point request status and notes.
 * If status changed to 'completed', also inserts into customer_points with type='delete' and session_id=null.
 */
export async function updateCustomerPointReq(
  id: string,
  params: {
    status: CuspntreqStatus;
    notes?: string;
    points: number;
    customer_id: string;
    previousStatus?: CuspntreqStatus;
  }
): Promise<{ success: boolean; error: Error | null }> {
  const now = new Date().toISOString();

  // Local storage update for persistence across client demo sessions
  const localList = getLocalRequests();
  const index = localList.findIndex((item) => item.id === id);
  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      status: params.status,
      notes: params.notes !== undefined ? params.notes : localList[index].notes,
      updated_at: now,
    };
    setLocalRequests(localList);
  }

  // If status is completed and wasn't already completed, add into customer_points (with type='delete', no session_id)
  if (params.status === 'completed' && params.previousStatus !== 'completed') {
    // Record in local points ledger if available
    if (typeof window !== 'undefined') {
      const custStorage = localStorage.getItem('plyaqua_customers_data');
      if (custStorage) {
        try {
          const customers = JSON.parse(custStorage);
          const cIdx = customers.findIndex((c: any) => c.id === params.customer_id);
          if (cIdx !== -1) {
            customers[cIdx].available_points = Math.max(0, (customers[cIdx].available_points || 0) - params.points);
            localStorage.setItem('plyaqua_customers_data', JSON.stringify(customers));
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (isPlaceholderConfig()) {
    return { success: true, error: null };
  }

  try {
    // 1. Update customer_points_reqs row
    const { error: updateError } = await supabase
      .from('customer_points_reqs')
      .update({
        status: params.status,
        notes: params.notes || null,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      console.warn('Error updating customer_points_reqs in Supabase:', updateError.message);
    }

    // 2. If completed, add row in customer_points with type='delete', no session_id
    if (params.status === 'completed' && params.previousStatus !== 'completed') {
      const { error: insertError } = await supabase.from('customer_points').insert([
        {
          type: 'delete',
          points: params.points,
          customer_id: params.customer_id,
          session_id: null,
          notes: params.notes ? `Redemption completed: ₹{params.notes}` : 'Customer points redemption request completed',
          created_at: now,
          updated_at: now,
        },
      ]);

      if (insertError) {
        console.warn('Error adding row to customer_points table:', insertError.message);
      }

      // Also decrement customer's available points in customers table
      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('available_points')
          .eq('id', params.customer_id)
          .single();

        if (customerData) {
          const newAvl = Math.max(0, (customerData.available_points || 0) - params.points);
          await supabase
            .from('customers')
            .update({ available_points: newAvl, updated_at: now })
            .eq('id', params.customer_id);
        }
      } catch (custErr) {
        console.warn('Failed to update customer available points:', custErr);
      }
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Failed to update request');
    return { success: false, error };
  }
}
