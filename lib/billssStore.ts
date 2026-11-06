import { supabase } from './supabase';
import { getPartners } from './partnersStore';
import { getProducts } from './productsStore';

export type BillStatus = 'pending' | 'delivered' | 'accepted';

export interface BillItem {
  id?: string;
  bill_id?: string;
  product_id: string;
  product_name?: string;
  product_size?: string;
  sp: number;
  qty: number;
  row_total: number;
  created_at?: string;
  updated_at?: string;
}

export interface Bill {
  id: string;
  bill_id: string;
  partner_id: string;
  partner_name?: string;
  partner_mobile?: string;
  partner_category_id?: string;
  partner_category_name?: string;
  amount: number;
  status: BillStatus;
  notes?: string | null;
  balance: number;
  bill_date: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
  items?: BillItem[];
}

const LOCAL_BILLS_KEY = 'plyaqua_bills_data';
const LOCAL_ITEMS_KEY = 'plyaqua_bill_items_data';

// Helper to generate bill_random(5 number): e.g. bill_74219
export function generateRandomBillId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `bill_${randomNum}`;
}

const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const initialDemoBills: Bill[] = [
  {
    id: '66666666-6666-6666-6666-666666666601',
    bill_id: 'bill_84920',
    partner_id: '22222222-2222-2222-2222-222222222201',
    partner_name: 'Aqua Wave Logistics',
    partner_mobile: '+1 (555) 234-5678',
    partner_category_id: '11111111-1111-1111-1111-111111111101',
    partner_category_name: 'Wholesale Distributors',
    amount: 1500.0,
    status: 'accepted',
    notes: 'Order delivered to Riverdale warehouse loading bay.',
    balance: 0.0,
    bill_date: getTodayString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    partner_id: '22222222-2222-2222-2222-222222222202',
    partner_name: 'Metro Springs Mart',
    partner_mobile: '+1 (555) 876-5432',
    partner_category_id: '11111111-1111-1111-1111-111111111102',
    partner_category_name: 'Retail Supermarkets',
    amount: 1400.0,
    status: 'pending',
    notes: 'Awaiting distributor dispatch confirmation.',
    balance: 400.0,
    bill_date: getTodayString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

const getLocalBills = (): Bill[] => {
  if (typeof window === 'undefined') return initialDemoBills;
  const saved = localStorage.getItem(LOCAL_BILLS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_BILLS_KEY, JSON.stringify(initialDemoBills));
    return initialDemoBills;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoBills;
  }
};

const setLocalBills = (bills: Bill[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_BILLS_KEY, JSON.stringify(bills));
};

/**
 * Fetch all bills enriched with partner and items info
 */
export async function getBills(): Promise<{
  data: Bill[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    return { data: getLocalBills(), error: null };
  }

  try {
    const [billsRes, partnersRes, productsRes] = await Promise.all([
      supabase.from('bills').select('*').order('created_at', { ascending: false }),
      getPartners(),
      getProducts(),
    ]);

    if (billsRes.error) {
      console.warn('Supabase bills query error, using local state:', billsRes.error.message);
      return { data: getLocalBills(), error: null };
    }

    if (!billsRes.data || billsRes.data.length === 0) {
      return { data: [], error: null };
    }

    const partnerMap = new Map<string, { name: string; mobile: string; catId?: string; catName?: string }>();
    partnersRes.data.forEach((p) => {
      partnerMap.set(p.id, {
        name: p.name,
        mobile: p.mobile,
        catId: p.partner_category || undefined,
        catName: p.partner_category_name || undefined,
      });
    });

    const productMap = new Map<string, { name: string; size?: string }>();
    productsRes.data.forEach((pr) => {
      productMap.set(pr.id, {
        name: pr.name,
        size: pr.size_value || undefined,
      });
    });

    // Fetch all bill items
    const { data: itemsData } = await supabase.from('bill_items').select('*');
    const itemsMap = new Map<string, BillItem[]>();

    if (itemsData) {
      itemsData.forEach((it) => {
        const prodInfo = productMap.get(it.product_id);
        const mappedItem: BillItem = {
          id: it.id,
          bill_id: it.bill_id,
          product_id: it.product_id,
          product_name: prodInfo?.name || 'Beverage Product',
          product_size: prodInfo?.size || 'Standard',
          sp: Number(it.sp) || 0,
          qty: Number(it.qty) || 0,
          row_total: Number(it.row_total) || 0,
          created_at: it.created_at,
          updated_at: it.updated_at,
        };
        const list = itemsMap.get(it.bill_id) || [];
        list.push(mappedItem);
        itemsMap.set(it.bill_id, list);
      });
    }

    const formatted: Bill[] = billsRes.data.map((b) => {
      const pInfo = partnerMap.get(b.partner_id);
      const bItems = itemsMap.get(b.id) || [];
      const billDate = b.bill_date ? b.bill_date.split('T')[0] : (b.created_at ? b.created_at.split('T')[0] : getTodayString());

      return {
        id: b.id,
        bill_id: b.bill_id,
        partner_id: b.partner_id,
        partner_name: pInfo?.name || 'Partner',
        partner_mobile: pInfo?.mobile || '—',
        partner_category_id: pInfo?.catId,
        partner_category_name: pInfo?.catName,
        amount: Number(b.amount) || 0,
        status: b.status as BillStatus,
        notes: b.notes,
        balance: Number(b.balance) || 0,
        bill_date: billDate,
        created_at: b.created_at,
        updated_at: b.updated_at,
        items: bItems,
      };
    });

    setLocalBills(formatted);
    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalBills(),
      error: err instanceof Error ? err : new Error('Failed to fetch bills'),
    };
  }
}

/**
 * Fetch a single bill by ID
 */
export async function getBillById(id: string): Promise<{
  data: Bill | null;
  error: Error | null;
}> {
  const { data: bills, error } = await getBills();
  if (error) {
    return { data: null, error };
  }
  const found = bills.find((b) => b.id === id || b.bill_id === id);
  if (!found) {
    return { data: null, error: new Error('Bill not found') };
  }
  return { data: found, error: null };
}

/**
 * Create a new bill in public.bills and its items in public.bill_items
 * Total amount is calculated from sum of bill_items.row_total
 */
export async function createBill(params: {
  bill_id: string;
  partner_id: string;
  bill_date: string;
  status: BillStatus;
  notes?: string;
  balance: number;
  items: Array<{
    product_id: string;
    product_name?: string;
    product_size?: string;
    sp: number;
    qty: number;
    row_total: number;
  }>;
}): Promise<{
  data: Bill | null;
  error: Error | null;
}> {
  const totalAmount = params.items.reduce((sum, item) => sum + (Number(item.row_total) || 0), 0);
  const current = getLocalBills();

  const [partnersRes] = await Promise.all([getPartners()]);
  const partnerObj = partnersRes.data.find((p) => p.id === params.partner_id);

  const newBillId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-bill-${Date.now()}`;
  const now = new Date().toISOString();

  const formattedItems: BillItem[] = params.items.map((it) => ({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-item-${Date.now()}-${Math.random()}`,
    bill_id: newBillId,
    product_id: it.product_id,
    product_name: it.product_name || 'Product',
    product_size: it.product_size || 'Standard',
    sp: Number(it.sp),
    qty: Number(it.qty),
    row_total: Number(it.row_total),
    created_at: now,
    updated_at: now,
  }));

  const localNewBill: Bill = {
    id: newBillId,
    bill_id: params.bill_id,
    partner_id: params.partner_id,
    partner_name: partnerObj?.name || 'Partner',
    partner_mobile: partnerObj?.mobile || '—',
    partner_category_id: partnerObj?.partner_category || undefined,
    partner_category_name: partnerObj?.partner_category_name || undefined,
    amount: totalAmount,
    status: params.status,
    notes: params.notes || null,
    balance: Number(params.balance) || 0,
    bill_date: params.bill_date || getTodayString(),
    created_at: now,
    updated_at: now,
    items: formattedItems,
  };

  if (isPlaceholderConfig()) {
    const updated = [localNewBill, ...current];
    setLocalBills(updated);
    return { data: localNewBill, error: null };
  }

  try {
    // 1. Insert into public.bills
    const { data: billRecord, error: billErr } = await supabase
      .from('bills')
      .insert({
        bill_id: params.bill_id,
        partner_id: params.partner_id,
        amount: totalAmount,
        status: params.status,
        notes: params.notes || null,
        balance: Number(params.balance) || 0,
        bill_date: params.bill_date || getTodayString(),
      })
      .select()
      .single();

    if (billErr) {
      console.warn('Supabase bill insert error, using local fallback:', billErr.message);
      const updated = [localNewBill, ...current];
      setLocalBills(updated);
      return { data: localNewBill, error: null };
    }

    // 2. Insert items into public.bill_items
    if (params.items.length > 0) {
      const itemsPayload = params.items.map((it) => ({
        bill_id: billRecord.id,
        product_id: it.product_id,
        sp: Number(it.sp),
        qty: Number(it.qty),
        row_total: Number(it.row_total),
      }));

      await supabase.from('bill_items').insert(itemsPayload);
    }

    const createdBill: Bill = {
      ...localNewBill,
      id: billRecord.id,
      amount: totalAmount,
      created_at: billRecord.created_at,
      updated_at: billRecord.updated_at,
    };

    setLocalBills([createdBill, ...current]);
    return { data: createdBill, error: null };
  } catch (err: unknown) {
    const updated = [localNewBill, ...current];
    setLocalBills(updated);
    return {
      data: localNewBill,
      error: err instanceof Error ? err : new Error('Failed to create bill'),
    };
  }
}

/**
 * Update bill and its line items (all fields except bill_id)
 */
export async function updateBill(
  id: string,
  updates: {
    partner_id: string;
    bill_date: string;
    status: BillStatus;
    notes?: string;
    balance: number;
    items: Array<{
      id?: string;
      product_id: string;
      product_name?: string;
      product_size?: string;
      sp: number;
      qty: number;
      row_total: number;
    }>;
  }
): Promise<{
  data: Bill | null;
  error: Error | null;
}> {
  const totalAmount = updates.items.reduce((sum, item) => sum + (Number(item.row_total) || 0), 0);
  const current = getLocalBills();
  const localIndex = current.findIndex((b) => b.id === id);

  const [partnersRes] = await Promise.all([getPartners()]);
  const partnerObj = partnersRes.data.find((p) => p.id === updates.partner_id);

  const now = new Date().toISOString();

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      const updatedBill: Bill = {
        ...current[localIndex],
        partner_id: updates.partner_id,
        partner_name: partnerObj?.name || current[localIndex].partner_name,
        partner_mobile: partnerObj?.mobile || current[localIndex].partner_mobile,
        partner_category_id: partnerObj?.partner_category || current[localIndex].partner_category_id,
        partner_category_name: partnerObj?.partner_category_name || current[localIndex].partner_category_name,
        amount: totalAmount,
        status: updates.status,
        notes: updates.notes || null,
        balance: Number(updates.balance) || 0,
        bill_date: updates.bill_date,
        updated_at: now,
        items: updates.items.map((it) => ({
          id: it.id || `temp-item-${Date.now()}-${Math.random()}`,
          bill_id: id,
          product_id: it.product_id,
          product_name: it.product_name,
          product_size: it.product_size,
          sp: Number(it.sp),
          qty: Number(it.qty),
          row_total: Number(it.row_total),
          updated_at: now,
        })),
      };

      current[localIndex] = updatedBill;
      setLocalBills(current);
      return { data: updatedBill, error: null };
    }
    return { data: null, error: new Error('Bill not found') };
  }

  try {
    // 1. Update public.bills
    await supabase
      .from('bills')
      .update({
        partner_id: updates.partner_id,
        amount: totalAmount,
        status: updates.status,
        notes: updates.notes || null,
        balance: Number(updates.balance) || 0,
        bill_date: updates.bill_date,
        updated_at: now,
      })
      .eq('id', id);

    // 2. Replace bill items
    await supabase.from('bill_items').delete().eq('bill_id', id);

    if (updates.items.length > 0) {
      const newItemsPayload = updates.items.map((it) => ({
        bill_id: id,
        product_id: it.product_id,
        sp: Number(it.sp),
        qty: Number(it.qty),
        row_total: Number(it.row_total),
      }));

      await supabase.from('bill_items').insert(newItemsPayload);
    }

    if (localIndex !== -1) {
      const updatedLocal: Bill = {
        ...current[localIndex],
        partner_id: updates.partner_id,
        partner_name: partnerObj?.name || current[localIndex].partner_name,
        amount: totalAmount,
        status: updates.status,
        notes: updates.notes || null,
        balance: Number(updates.balance) || 0,
        bill_date: updates.bill_date,
        updated_at: now,
        items: updates.items.map((it) => ({
          ...it,
          bill_id: id,
          sp: Number(it.sp),
          qty: Number(it.qty),
          row_total: Number(it.row_total),
        })),
      };
      current[localIndex] = updatedLocal;
      setLocalBills(current);
      return { data: updatedLocal, error: null };
    }

    return {
      data: {
        id,
        bill_id: current[localIndex]?.bill_id || 'bill_00000',
        partner_id: updates.partner_id,
        amount: totalAmount,
        status: updates.status,
        balance: Number(updates.balance) || 0,
        bill_date: updates.bill_date,
        notes: updates.notes,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update bill'),
    };
  }
}
