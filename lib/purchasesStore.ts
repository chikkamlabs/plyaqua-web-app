import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { fetchProductDetailsMap } from './stockStore';

export interface PurchaseItem {
  id: string;
  bill_id: string;
  product_id: string;
  product_name?: string;
  product_size?: string;
  sp: number;
  qty: number;
  row_total: number;
  created_at?: string;
  updated_at?: string;
}

export interface Purchase {
  id: string;
  bill_id: string;
  partner_id: string;
  partner_name?: string;
  amount: number;
  status: 'pending' | 'delivered' | 'accepted';
  notes?: string | null;
  balance: number;
  bill_date: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
  items: PurchaseItem[];
  products_count: number; // length of bill_items
  items_count: number; // sum of qty on bill_items
}

const LOCAL_PURCHASES_KEY = 'plyaqua_purchases_data';

// Helper to format date as YYYY-MM-DD
export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to calculate default last one week date range (7 days ago to today)
export function getDefaultOneWeekRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    fromDate: formatDateYMD(sevenDaysAgo),
    toDate: formatDateYMD(today),
  };
}

// Initial demo purchases for fallback/offline/preview mode
const initialDemoPurchases: Purchase[] = [
  {
    id: '66666666-6666-6666-6666-666666666601',
    bill_id: 'bill_84920',
    partner_id: '22222222-2222-2222-2222-222222222201',
    partner_name: 'Aqua Wave Logistics',
    amount: 1500.0,
    status: 'accepted',
    notes: 'Order delivered to Riverdale warehouse loading bay.',
    balance: 0.0,
    bill_date: formatDateYMD(new Date()),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    products_count: 1,
    items_count: 100,
    items: [
      {
        id: '77777777-7777-7777-7777-777777777701',
        bill_id: '66666666-6666-6666-6666-666666666601',
        product_id: '55555555-5555-5555-5555-555555555501',
        product_name: 'PlyAqua Pure Spring Water 500ml',
        product_size: '500ml',
        sp: 15.0,
        qty: 100,
        row_total: 1500.0,
      },
    ],
  },
  {
    id: '66666666-6666-6666-6666-666666666602',
    bill_id: 'bill_31945',
    partner_id: '22222222-2222-2222-2222-222222222201',
    partner_name: 'Aqua Wave Logistics',
    amount: 1400.0,
    status: 'pending',
    notes: 'Awaiting distributor dispatch confirmation.',
    balance: 400.0,
    bill_date: formatDateYMD(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    products_count: 2,
    items_count: 75,
    items: [
      {
        id: '77777777-7777-7777-7777-777777777702',
        bill_id: '66666666-6666-6666-6666-666666666602',
        product_id: '55555555-5555-5555-5555-555555555502',
        product_name: 'PlyAqua Mineral Water 1000ml',
        product_size: '1000ml',
        sp: 28.0,
        qty: 50,
        row_total: 1400.0,
      },
      {
        id: '77777777-7777-7777-7777-777777777703',
        bill_id: '66666666-6666-6666-6666-666666666602',
        product_id: '55555555-5555-5555-5555-555555555501',
        product_name: 'PlyAqua Pure Spring Water 500ml',
        product_size: '500ml',
        sp: 15.0,
        qty: 25,
        row_total: 375.0,
      },
    ],
  },
  {
    id: '66666666-6666-6666-6666-666666666603',
    bill_id: 'bill_98124',
    partner_id: '22222222-2222-2222-2222-222222222201',
    partner_name: 'Aqua Wave Logistics',
    amount: 2150.0,
    status: 'delivered',
    notes: 'Bulk weekend restocking order.',
    balance: 0.0,
    bill_date: formatDateYMD(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    products_count: 1,
    items_count: 150,
    items: [
      {
        id: '77777777-7777-7777-7777-777777777704',
        bill_id: '66666666-6666-6666-6666-666666666603',
        product_id: '55555555-5555-5555-5555-555555555501',
        product_name: 'PlyAqua Pure Spring Water 500ml',
        product_size: '500ml',
        sp: 14.33,
        qty: 150,
        row_total: 2150.0,
      },
    ],
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

const getLocalPurchases = (): Purchase[] => {
  if (typeof window === 'undefined') return initialDemoPurchases;
  const saved = localStorage.getItem(LOCAL_PURCHASES_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_PURCHASES_KEY, JSON.stringify(initialDemoPurchases));
    return initialDemoPurchases;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoPurchases;
  }
};

const setLocalPurchases = (purchases: Purchase[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_PURCHASES_KEY, JSON.stringify(purchases));
};

/**
 * Calculate count of purchases created or dated "This week" (last 7 days or current week)
 */
export function getThisWeekPurchasesCount(purchases: Purchase[]): number {
  const now = new Date();
  // Get start of this week (Monday)
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const mondayStr = formatDateYMD(monday);
  const todayStr = formatDateYMD(now);

  return purchases.filter((p) => {
    const d = p.bill_date || (p.created_at ? p.created_at.split('T')[0] : '');
    return d >= mondayStr && d <= todayStr;
  }).length;
}

/**
 * Fetch list of purchases from public.bills and public.bill_items for current partner
 */
export async function getPartnerPurchases(filters?: {
  searchBillId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{
  data: Purchase[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalPurchases();

    if (filters?.searchBillId && filters.searchBillId.trim()) {
      const q = filters.searchBillId.trim().toLowerCase();
      list = list.filter((p) => p.bill_id.toLowerCase().includes(q));
    }

    if (filters?.fromDate) {
      list = list.filter((p) => p.bill_date >= filters.fromDate!);
    }

    if (filters?.toDate) {
      list = list.filter((p) => p.bill_date <= filters.toDate!);
    }

    return { data: list, error: null };
  }

  try {
    const authUser = await getCurrentUser();
    let query = supabase
      .from('bills')
      .select('*')
      .order('bill_date', { ascending: false });

    // If partner is authenticated, filter to their bills
    if (authUser?.id) {
      query = query.eq('partner_id', authUser.id);
    }

    if (filters?.searchBillId && filters.searchBillId.trim()) {
      query = query.ilike('bill_id', `%${filters.searchBillId.trim()}%`);
    }

    if (filters?.fromDate) {
      query = query.gte('bill_date', filters.fromDate);
    }

    if (filters?.toDate) {
      query = query.lte('bill_date', filters.toDate);
    }

    const { data: billsData, error: billsErr } = await query;

    if (billsErr) {
      console.warn('Supabase bills query error, using local fallback:', billsErr.message);
      let list = getLocalPurchases();
      if (filters?.searchBillId && filters.searchBillId.trim()) {
        const q = filters.searchBillId.trim().toLowerCase();
        list = list.filter((p) => p.bill_id.toLowerCase().includes(q));
      }
      if (filters?.fromDate) {
        list = list.filter((p) => p.bill_date >= filters.fromDate!);
      }
      if (filters?.toDate) {
        list = list.filter((p) => p.bill_date <= filters.toDate!);
      }
      return { data: list, error: null };
    }

    if (!billsData || billsData.length === 0) {
      return { data: [], error: null };
    }

    // Fetch line items and products
    const billIds = billsData.map((b) => b.id);
    const [itemsRes, productMap] = await Promise.all([
      supabase.from('bill_items').select('*').in('bill_id', billIds),
      fetchProductDetailsMap(),
    ]);

    const itemsMap = new Map<string, PurchaseItem[]>();
    if (itemsRes.data) {
      itemsRes.data.forEach((it) => {
        const prod = productMap.get(it.product_id);
        const item: PurchaseItem = {
          id: it.id,
          bill_id: it.bill_id,
          product_id: it.product_id,
          product_name: prod?.name || 'Product',
          product_size: prod?.size || 'Standard',
          sp: Number(it.sp) || 0,
          qty: Number(it.qty) || 0,
          row_total: Number(it.row_total) || 0,
          created_at: it.created_at,
          updated_at: it.updated_at,
        };
        const list = itemsMap.get(it.bill_id) || [];
        list.push(item);
        itemsMap.set(it.bill_id, list);
      });
    }

    const purchases: Purchase[] = billsData.map((b) => {
      const items = itemsMap.get(b.id) || [];
      const products_count = items.length;
      const items_count = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      const billDate = b.bill_date ? b.bill_date.split('T')[0] : formatDateYMD(new Date());

      return {
        id: b.id,
        bill_id: b.bill_id,
        partner_id: b.partner_id,
        amount: Number(b.amount) || 0,
        status: b.status as 'pending' | 'delivered' | 'accepted',
        notes: b.notes,
        balance: Number(b.balance) || 0,
        bill_date: billDate,
        created_at: b.created_at,
        updated_at: b.updated_at,
        items,
        products_count,
        items_count,
      };
    });

    setLocalPurchases(purchases);
    return { data: purchases, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalPurchases(),
      error: err instanceof Error ? err : new Error('Failed to load purchases'),
    };
  }
}

/**
 * Fetch all details of a single purchase by id or bill_id
 */
export async function getPurchaseById(id: string): Promise<{
  data: Purchase | null;
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    const list = getLocalPurchases();
    const found = list.find((p) => p.id === id || p.bill_id === id);
    if (!found) {
      return { data: null, error: new Error('Purchase record not found') };
    }
    return { data: found, error: null };
  }

  try {
    const { data: bill, error: billErr } = await supabase
      .from('bills')
      .select('*')
      .or(`id.eq.${id},bill_id.eq.${id}`)
      .maybeSingle();

    if (billErr || !bill) {
      const list = getLocalPurchases();
      const found = list.find((p) => p.id === id || p.bill_id === id);
      if (found) return { data: found, error: null };
      return { data: null, error: billErr ? new Error(billErr.message) : new Error('Purchase not found') };
    }

    const [itemsRes, productMap] = await Promise.all([
      supabase.from('bill_items').select('*').eq('bill_id', bill.id),
      fetchProductDetailsMap(),
    ]);

    const items: PurchaseItem[] = (itemsRes.data || []).map((it) => {
      const prod = productMap.get(it.product_id);
      return {
        id: it.id,
        bill_id: it.bill_id,
        product_id: it.product_id,
        product_name: prod?.name || 'Product',
        product_size: prod?.size || 'Standard',
        sp: Number(it.sp) || 0,
        qty: Number(it.qty) || 0,
        row_total: Number(it.row_total) || 0,
        created_at: it.created_at,
        updated_at: it.updated_at,
      };
    });

    const products_count = items.length;
    const items_count = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const purchase: Purchase = {
      id: bill.id,
      bill_id: bill.bill_id,
      partner_id: bill.partner_id,
      amount: Number(bill.amount) || 0,
      status: bill.status as 'pending' | 'delivered' | 'accepted',
      notes: bill.notes,
      balance: Number(bill.balance) || 0,
      bill_date: bill.bill_date ? bill.bill_date.split('T')[0] : formatDateYMD(new Date()),
      created_at: bill.created_at,
      updated_at: bill.updated_at,
      items,
      products_count,
      items_count,
    };

    return { data: purchase, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch purchase details'),
    };
  }
}

/**
 * Update purchase status strictly to 'accepted' only
 */
export async function updatePurchaseStatusToAccepted(id: string): Promise<{
  data: Purchase | null;
  error: Error | null;
}> {
  const current = getLocalPurchases();
  const index = current.findIndex((p) => p.id === id || p.bill_id === id);

  if (isPlaceholderConfig()) {
    if (index !== -1) {
      current[index] = {
        ...current[index],
        status: 'accepted',
        updated_at: new Date().toISOString(),
      };
      setLocalPurchases(current);
      return { data: current[index], error: null };
    }
    return { data: null, error: new Error('Purchase record not found') };
  }

  try {
    const { data: updatedBill, error: updateErr } = await supabase
      .from('bills')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${id},bill_id.eq.${id}`)
      .select()
      .maybeSingle();

    if (updateErr) {
      if (index !== -1) {
        current[index] = {
          ...current[index],
          status: 'accepted',
          updated_at: new Date().toISOString(),
        };
        setLocalPurchases(current);
        return { data: current[index], error: null };
      }
      return { data: null, error: new Error(updateErr.message) };
    }

    if (index !== -1) {
      current[index] = {
        ...current[index],
        status: 'accepted',
        updated_at: new Date().toISOString(),
      };
      setLocalPurchases(current);
    }

    return await getPurchaseById(id);
  } catch (err: unknown) {
    if (index !== -1) {
      current[index] = {
        ...current[index],
        status: 'accepted',
      };
      setLocalPurchases(current);
      return { data: current[index], error: null };
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to accept purchase'),
    };
  }
}
