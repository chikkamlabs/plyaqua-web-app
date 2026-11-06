import { supabase } from './supabase';

export type CashbackStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';

export interface CashbackSessionItem {
  id: string; // customer_cashback.id
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  cashback_amnt: number;
  upi_id: string;
  status: string;
  playcode_id?: string | null;
  plycode: string; // Resolved playcode code
  session_id?: string | null;
  created_at: string;
  created_at_ist: string;
}

export interface CashbackSummary {
  totalCount: number; // Count as per the Filtered Dates
  totalSum: number; // Sum of cashback amount
}

export interface CashbackFilters {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  customerMobile?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_customer_cashback_sessions_data';

// Helper to format ISO timestamp into Indian Standard Time (IST - UTC+5:30)
export function formatToIST(dateInput: string | Date): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '—';

    return (
      d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch {
    return String(dateInput);
  }
}

// Helper to get Today's Date in YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

// Generate realistic default mock data with today's entries
function getInitialDemoCashbacks(): CashbackSessionItem[] {
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);

  return [
    {
      id: 'cb-001',
      customer_id: '33333333-3333-3333-3333-333333333301',
      customer_name: 'Alex Morgan',
      customer_mobile: '+1 (555) 345-6789',
      cashback_amnt: 50.0,
      upi_id: 'alexmorgan@okaxis',
      status: 'pending',
      playcode_id: 'pc-101',
      plycode: 'PLY-8492',
      session_id: 'sess-today-001',
      created_at: `${today}T10:15:30.000Z`,
      created_at_ist: formatToIST(`${today}T10:15:30.000Z`),
    },
    {
      id: 'cb-002',
      customer_id: '33333333-3333-3333-3333-333333333302',
      customer_name: 'Samantha Reed',
      customer_mobile: '+1 (555) 987-6543',
      cashback_amnt: 100.0,
      upi_id: 'samanthareed@oksbi',
      status: 'processing',
      playcode_id: 'pc-102',
      plycode: 'PLY-9120',
      session_id: 'sess-today-002',
      created_at: `${today}T11:42:15.000Z`,
      created_at_ist: formatToIST(`${today}T11:42:15.000Z`),
    },
    {
      id: 'cb-003',
      customer_id: '33333333-3333-3333-3333-333333333303',
      customer_name: 'Marcus Chen',
      customer_mobile: '+1 (555) 456-7890',
      cashback_amnt: 75.5,
      upi_id: 'marcus.chen@paytm',
      status: 'completed',
      playcode_id: 'pc-103',
      plycode: 'PLY-7341',
      session_id: 'sess-today-003',
      created_at: `${today}T14:20:00.000Z`,
      created_at_ist: formatToIST(`${today}T14:20:00.000Z`),
    },
    {
      id: 'cb-004',
      customer_id: '33333333-3333-3333-3333-333333333304',
      customer_name: 'Elena Rostova',
      customer_mobile: '+1 (555) 567-8901',
      cashback_amnt: 120.0,
      upi_id: 'elena.rostova@icici',
      status: 'pending',
      playcode_id: 'pc-104',
      plycode: 'PLY-6632',
      session_id: 'sess-today-004',
      created_at: `${today}T15:05:40.000Z`,
      created_at_ist: formatToIST(`${today}T15:05:40.000Z`),
    },
    {
      id: 'cb-005',
      customer_id: '33333333-3333-3333-3333-333333333301',
      customer_name: 'Alex Morgan',
      customer_mobile: '+1 (555) 345-6789',
      cashback_amnt: 40.0,
      upi_id: 'alexmorgan@okaxis',
      status: 'completed',
      playcode_id: 'pc-105',
      plycode: 'PLY-5521',
      session_id: 'sess-yest-001',
      created_at: `${yesterday}T16:30:00.000Z`,
      created_at_ist: formatToIST(`${yesterday}T16:30:00.000Z`),
    },
    {
      id: 'cb-006',
      customer_id: '33333333-3333-3333-3333-333333333302',
      customer_name: 'Samantha Reed',
      customer_mobile: '+1 (555) 987-6543',
      cashback_amnt: 25.0,
      upi_id: 'samanthareed@oksbi',
      status: 'rejected',
      playcode_id: 'pc-106',
      plycode: 'PLY-4412',
      session_id: 'sess-yest-002',
      created_at: `${twoDaysAgo}T09:12:00.000Z`,
      created_at_ist: formatToIST(`${twoDaysAgo}T09:12:00.000Z`),
    },
  ];
}

function getLocalCashbacks(): CashbackSessionItem[] {
  if (typeof window === 'undefined') return getInitialDemoCashbacks();
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      const initial = getInitialDemoCashbacks();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(saved);
  } catch {
    return getInitialDemoCashbacks();
  }
}

function setLocalCashbacks(items: CashbackSessionItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cashbacks to localStorage:', e);
  }
}

/**
 * Fetch all cashback sessions with optional date and customer number filters.
 * Returns the list of sessions along with Total Count and Total Sum for the filtered dates.
 */
export async function getCashbackSessions(filters?: CashbackFilters): Promise<{
  data: CashbackSessionItem[];
  totalCount: number;
  totalSum: number;
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalCashbacks();

    // Filter by dates
    if (filters?.fromDate) {
      list = list.filter((item) => (item.created_at || '').slice(0, 10) >= filters.fromDate!);
    }
    if (filters?.toDate) {
      list = list.filter((item) => (item.created_at || '').slice(0, 10) <= filters.toDate!);
    }

    // Filter by customer number (mobile)
    if (filters?.customerMobile && filters.customerMobile.trim()) {
      const q = filters.customerMobile.trim().toLowerCase();
      list = list.filter((item) => item.customer_mobile.toLowerCase().includes(q));
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalCount = list.length;
    const totalSum = list.reduce((sum, item) => sum + (Number(item.cashback_amnt) || 0), 0);

    return {
      data: list,
      totalCount,
      totalSum,
      error: null,
    };
  }

  try {
    // 1. Fetch customer_cashback rows
    let query = supabase
      .from('customer_cashback')
      .select(`
        id,
        customer_id,
        mbl,
        cashback_amnt,
        upi_id,
        status,
        playcode,
        session_id,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      query = query.gte('created_at', `${filters.fromDate}T00:00:00.000Z`);
    }
    if (filters?.toDate) {
      query = query.lte('created_at', `${filters.toDate}T23:59:59.999Z`);
    }

    const { data: cbData, error: cbErr } = await query;

    if (cbErr) {
      console.warn('Supabase customer_cashback query error, using local fallback:', cbErr.message);
      return getCashbackSessions(filters);
    }

    // 2. Fetch customers for names & mobile
    const { data: custData } = await supabase.from('customers').select('id, name, mobile');
    const customerMap = new Map<string, { name: string; mobile: string }>();
    if (custData) {
      custData.forEach((c) => customerMap.set(c.id, { name: c.name, mobile: c.mobile }));
    }

    // 3. Fetch playcodes for plycode string code
    const { data: playData } = await supabase.from('playcodes').select('id, code');
    const playcodeMap = new Map<string, string>();
    if (playData) {
      playData.forEach((p) => playcodeMap.set(p.id, p.code));
    }

    let items: CashbackSessionItem[] = (cbData || []).map((row) => {
      const cust = customerMap.get(row.customer_id);
      const plycodeStr = row.playcode ? playcodeMap.get(row.playcode) || 'PLY-CODE' : '—';
      return {
        id: row.id,
        customer_id: row.customer_id,
        customer_name: cust?.name || 'Customer',
        customer_mobile: row.mbl || cust?.mobile || '—',
        cashback_amnt: Number(row.cashback_amnt) || 0,
        upi_id: row.upi_id || '—',
        status: row.status || 'pending',
        playcode_id: row.playcode,
        plycode: plycodeStr,
        session_id: row.session_id,
        created_at: row.created_at,
        created_at_ist: formatToIST(row.created_at),
      };
    });

    // Client-side search by customer mobile number
    if (filters?.customerMobile && filters.customerMobile.trim()) {
      const q = filters.customerMobile.trim().toLowerCase();
      items = items.filter((item) => item.customer_mobile.toLowerCase().includes(q));
    }

    const totalCount = items.length;
    const totalSum = items.reduce((sum, item) => sum + (Number(item.cashback_amnt) || 0), 0);

    return {
      data: items,
      totalCount,
      totalSum,
      error: null,
    };
  } catch (err) {
    console.warn('Error fetching cashback sessions, using local fallback:', err);
    return getCashbackSessions(filters);
  }
}

/**
 * Updates the status of a customer cashback session in public.customer_cashback.
 * When status changes and user taps Save, updates in the database.
 */
export async function updateCashbackSessionStatus(
  id: string,
  newStatus: string
): Promise<{ success: boolean; error: Error | null }> {
  const now = new Date().toISOString();

  // Update local storage representation
  const localList = getLocalCashbacks();
  const idx = localList.findIndex((item) => item.id === id);
  if (idx !== -1) {
    localList[idx] = {
      ...localList[idx],
      status: newStatus,
    };
    setLocalCashbacks(localList);
  }

  if (isPlaceholderConfig()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('customer_cashback')
      .update({
        status: newStatus,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.warn('Failed to update customer_cashback status in Supabase:', error.message);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to update cashback session status'),
    };
  }
}
