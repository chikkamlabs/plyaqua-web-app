import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { getPartnerPointsSummary, formatDateYMD, PartnerPointTransaction } from './pointsStore';
import { ProductSize, Product } from './productsStore';

export interface ProductDetails {
  id: string; // product UUID
  prod_id: string; // e.g. prod_101
  name: string; // e.g. PlyAqua Pure Spring Water 500ml
  size: string; // e.g. 500ml
}

export interface PartnerStockItem {
  id: string; // partner_inventory id
  partner_id: string;
  product_id: string;
  prod_id: string;
  name: string;
  size: string;
  qty: number;
}

export interface StockSummary {
  totalProducts: number;
  totalBottles: number;
}

const LOCAL_INVENTORY_KEY = 'plyaqua_partner_inventory_data';

const initialDemoInventory: PartnerStockItem[] = [
  {
    id: 'inv-101',
    partner_id: '22222222-2222-2222-2222-222222222201',
    product_id: '55555555-5555-5555-5555-555555555501',
    prod_id: 'prod_101',
    name: 'PlyAqua Pure Spring Water 500ml',
    size: '500ml',
    qty: 150,
  },
  {
    id: 'inv-102',
    partner_id: '22222222-2222-2222-2222-222222222201',
    product_id: '55555555-5555-5555-5555-555555555502',
    prod_id: 'prod_102',
    name: 'PlyAqua Mineral Water 1000ml',
    size: '1000ml',
    qty: 80,
  },
  {
    id: 'inv-103',
    partner_id: '22222222-2222-2222-2222-222222222201',
    product_id: '55555555-5555-5555-5555-555555555503',
    prod_id: 'prod_103',
    name: 'PlyAqua Commercial Dispenser Jar 20L',
    size: '20L',
    qty: 25,
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

const getLocalInventory = (): PartnerStockItem[] => {
  if (typeof window === 'undefined') return initialDemoInventory;
  const saved = localStorage.getItem(LOCAL_INVENTORY_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(initialDemoInventory));
    return initialDemoInventory;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoInventory;
  }
};

const setLocalInventory = (items: PartnerStockItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(items));
};

/**
 * Fetch product details (name, size, prod_id) directly from public.products and public.sizes
 * Returns a map indexed by both product.id (UUID) and product.prod_id (e.g. prod_101)
 */
export async function fetchProductDetailsMap(): Promise<Map<string, ProductDetails>> {
  const map = new Map<string, ProductDetails>();

  // Default initial demo products
  const defaultProds: ProductDetails[] = [
    {
      id: '55555555-5555-5555-5555-555555555501',
      prod_id: 'prod_101',
      name: 'PlyAqua Pure Spring Water 500ml',
      size: '500ml',
    },
    {
      id: '55555555-5555-5555-5555-555555555502',
      prod_id: 'prod_102',
      name: 'PlyAqua Mineral Water 1000ml',
      size: '1000ml',
    },
    {
      id: '55555555-5555-5555-5555-555555555503',
      prod_id: 'prod_103',
      name: 'PlyAqua Commercial Dispenser Jar 20L',
      size: '20L',
    },
  ];

  defaultProds.forEach((p) => {
    map.set(p.id, p);
    map.set(p.prod_id, p);
  });

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('plyaqua_products_data');
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        const sizesSaved = localStorage.getItem('plyaqua_sizes_data');
        const sizesMap = new Map<string, string>();
        if (sizesSaved) {
          try {
            const parsedSizes: ProductSize[] = JSON.parse(sizesSaved);
            parsedSizes.forEach((s) => sizesMap.set(s.id, s.value));
          } catch {
            // ignore
          }
        }
        parsed.forEach((p) => {
          const sVal = (p.size && sizesMap.get(p.size)) || p.size_value || 'Standard';
          const d: ProductDetails = {
            id: p.id,
            prod_id: p.prod_id,
            name: p.name,
            size: sVal,
          };
          map.set(p.id, d);
          if (p.prod_id) map.set(p.prod_id, d);
        });
      } catch {
        // ignore
      }
    }
  }

  if (isPlaceholderConfig()) {
    return map;
  }

  try {
    // Query public.products and public.sizes directly from Supabase
    const [prodsRes, sizesRes] = await Promise.all([
      supabase.from('products').select('id, prod_id, name, size'),
      supabase.from('sizes').select('id, value'),
    ]);

    const sizeLookup = new Map<string, string>();
    if (sizesRes.data) {
      sizesRes.data.forEach((s: { id: string; value: string }) => {
        sizeLookup.set(s.id, s.value);
      });
    }

    if (prodsRes.data && prodsRes.data.length > 0) {
      prodsRes.data.forEach((p: { id: string; prod_id: string; name: string; size: string | null }) => {
        const sizeValue = p.size ? sizeLookup.get(p.size) || 'Standard' : 'Standard';
        const d: ProductDetails = {
          id: p.id,
          prod_id: p.prod_id || 'prod_101',
          name: p.name || 'PlyAqua Beverage Product',
          size: sizeValue,
        };
        map.set(p.id, d);
        if (p.prod_id) map.set(p.prod_id, d);
      });
    }

    return map;
  } catch (err) {
    console.warn('Failed to load product details from Supabase:', err);
    return map;
  }
}

/**
 * Fetch partner's stock inventory from public.partner_inventory.
 * Resolves product name and size from public.products table for that product_id.
 * If partnerId is provided, filters for that specific partner (e.g. admin view).
 */
export async function getPartnerStock(searchProdId?: string, partnerId?: string): Promise<{
  data: PartnerStockItem[];
  summary: StockSummary;
  error: Error | null;
}> {
  const prodMap = await fetchProductDetailsMap();

  if (isPlaceholderConfig()) {
    let rawList = getLocalInventory();
    if (partnerId) {
      rawList = rawList.filter((inv) => inv.partner_id === partnerId);
    }
    let list = rawList.map((inv) => {
      const p = prodMap.get(inv.product_id) || prodMap.get(inv.prod_id);
      return {
        ...inv,
        name: p?.name || inv.name,
        size: p?.size || inv.size,
        prod_id: p?.prod_id || inv.prod_id,
      };
    });

    const totalProducts = list.length;
    const totalBottles = list.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    if (searchProdId && searchProdId.trim()) {
      const q = searchProdId.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.prod_id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
      );
    }

    return {
      data: list,
      summary: { totalProducts, totalBottles },
      error: null,
    };
  }

  try {
    const user = await getCurrentUser();
    const effectivePartnerId = partnerId || user?.id;
    let query = supabase.from('partner_inventory').select('*');
    if (effectivePartnerId) {
      query = query.eq('partner_id', effectivePartnerId);
    }

    const { data: invData, error: invErr } = await query;

    if (invErr) {
      console.warn('Supabase partner_inventory query error, using local fallback:', invErr.message);
      let rawList = getLocalInventory();
      if (partnerId) {
        rawList = rawList.filter((inv) => inv.partner_id === partnerId);
      }
      let list = rawList.map((inv) => {
        const p = prodMap.get(inv.product_id) || prodMap.get(inv.prod_id);
        return {
          ...inv,
          name: p?.name || inv.name,
          size: p?.size || inv.size,
          prod_id: p?.prod_id || inv.prod_id,
        };
      });

      const totalProducts = list.length;
      const totalBottles = list.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

      if (searchProdId && searchProdId.trim()) {
        const q = searchProdId.trim().toLowerCase();
        list = list.filter(
          (item) =>
            item.prod_id.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q)
        );
      }

      return {
        data: list,
        summary: { totalProducts, totalBottles },
        error: null,
      };
    }

    const allInventory: PartnerStockItem[] = (invData || []).map((row) => {
      const pInfo = prodMap.get(row.product_id);
      return {
        id: row.id,
        partner_id: row.partner_id,
        product_id: row.product_id,
        prod_id: pInfo?.prod_id || 'prod_101',
        name: pInfo?.name || 'PlyAqua Product',
        size: pInfo?.size || 'Standard',
        qty: Number(row.qty) || 0,
      };
    });

    const totalProducts = allInventory.length;
    const totalBottles = allInventory.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    let filtered = allInventory;
    if (searchProdId && searchProdId.trim()) {
      const q = searchProdId.trim().toLowerCase();
      filtered = allInventory.filter(
        (item) =>
          item.prod_id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
      );
    }

    setLocalInventory(allInventory);

    return {
      data: filtered,
      summary: { totalProducts, totalBottles },
      error: null,
    };
  } catch (err: unknown) {
    let list = getLocalInventory().map((inv) => {
      const p = prodMap.get(inv.product_id) || prodMap.get(inv.prod_id);
      return {
        ...inv,
        name: p?.name || inv.name,
        size: p?.size || inv.size,
        prod_id: p?.prod_id || inv.prod_id,
      };
    });

    const totalProducts = list.length;
    const totalBottles = list.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    return {
      data: list,
      summary: { totalProducts, totalBottles },
      error: err instanceof Error ? err : new Error('Failed to load partner stock'),
    };
  }
}

/**
 * Add purchase product quantities to partner_inventory.
 * If product exists in partner_inventory for that partner, add up qty with existing qty;
 * if it does not exist, insert it into partner_inventory.
 */
export async function addPurchaseToPartnerInventory(
  partnerId: string,
  items: Array<{ product_id: string; product_name?: string; product_size?: string; qty: number }>
): Promise<{ success: boolean; error: Error | null }> {
  const currentLocal = getLocalInventory();
  const prodMap = await fetchProductDetailsMap();

  const user = await getCurrentUser();
  const effectivePartnerId = user?.id || partnerId;

  // Update local fallback copy first
  for (const item of items) {
    const existingIndex = currentLocal.findIndex(
      (inv) => inv.product_id === item.product_id && inv.partner_id === effectivePartnerId
    );
    if (existingIndex !== -1) {
      currentLocal[existingIndex].qty += Number(item.qty) || 0;
    } else {
      const pInfo = prodMap.get(item.product_id);
      currentLocal.push({
        id: `inv-${Date.now()}-${Math.random()}`,
        partner_id: effectivePartnerId,
        product_id: item.product_id,
        prod_id: pInfo?.prod_id || 'prod_101',
        name: pInfo?.name || item.product_name || 'PlyAqua Product',
        size: pInfo?.size || item.product_size || 'Standard',
        qty: Number(item.qty) || 0,
      });
    }
  }
  setLocalInventory([...currentLocal]);

  if (isPlaceholderConfig()) {
    return { success: true, error: null };
  }

  try {
    for (const item of items) {
      const itemQty = Number(item.qty) || 0;
      if (itemQty <= 0) continue;

      // 1. Check if product already exists in partner_inventory for this partner
      const { data: existing, error: checkErr } = await supabase
        .from('partner_inventory')
        .select('id, qty')
        .eq('partner_id', effectivePartnerId)
        .eq('product_id', item.product_id)
        .maybeSingle();

      if (checkErr) {
        console.warn('Error checking partner_inventory in Supabase:', checkErr.message);
      }

      if (existing) {
        // Exists: add up with existing qty
        const updatedQty = (Number(existing.qty) || 0) + itemQty;
        const { error: updErr } = await supabase
          .from('partner_inventory')
          .update({ qty: updatedQty })
          .eq('id', existing.id);

        if (updErr) {
          console.error('Error updating partner_inventory:', updErr.message);
          return { success: false, error: new Error(updErr.message) };
        }
      } else {
        // Does not exist: insert new row
        const { error: insErr } = await supabase.from('partner_inventory').insert({
          partner_id: effectivePartnerId,
          product_id: item.product_id,
          qty: itemQty,
        });

        if (insErr) {
          console.error('Error inserting into partner_inventory:', insErr.message);
          return { success: false, error: new Error(insErr.message) };
        }
      }
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Failed to add purchase to partner_inventory:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to update partner_inventory'),
    };
  }
}

/**
 * Record a sale:
 * 1. Decrease that product quantity in partner_inventory
 * 2. Insert into partner_points with:
 *    - type: 'add'
 *    - points: saleQty (Total sale items count as points)
 *    - avl_points: already existing available points + saleQty
 *    - notes: custom notes
 * 3. Also add in partner_profile:
 *    - available_points = available_points + saleQty
 *    - total_points = total_points + saleQty
 */
export async function recordPartnerSale(params: {
  productId: string;
  saleQty: number;
  notes?: string;
}): Promise<{
  success: boolean;
  newAvailablePoints?: number;
  error: Error | null;
}> {
  const { productId, saleQty, notes } = params;
  if (!saleQty || saleQty <= 0) {
    return { success: false, error: new Error('Please enter a valid sale quantity greater than 0.') };
  }

  const user = await getCurrentUser();
  const currentLocal = getLocalInventory();

  // Find target product in local inventory or fallback
  const targetItem = currentLocal.find(
    (i) => i.product_id === productId || i.id === productId || i.prod_id === productId
  );

  const effectivePartnerId = user?.id || targetItem?.partner_id || '22222222-2222-2222-2222-222222222201';
  const effectiveProductId = targetItem?.product_id || productId;

  // Decrease stock in local inventory
  if (targetItem) {
    targetItem.qty = Math.max(0, targetItem.qty - saleQty);
    setLocalInventory([...currentLocal]);
  }

  // Calculate new points
  const pointsSummaryRes = await getPartnerPointsSummary();
  const currentAvlPoints = pointsSummaryRes.data?.available_points ?? 2450;
  const currentTotalPoints = pointsSummaryRes.data?.total_points ?? 2750;

  const newAvlPoints = currentAvlPoints + saleQty;
  const newTotalPoints = currentTotalPoints + saleQty;

  const prodName = targetItem?.name || 'Bottle Product';
  const prodSize = targetItem?.size || '';
  const saleNote =
    notes?.trim() ||
    `Sale of ${saleQty} item(s) recorded: ${prodName}${prodSize ? ` (${prodSize})` : ''}.`;

  // Update local points ledger in localStorage
  if (typeof window !== 'undefined') {
    const savedPoints = localStorage.getItem('plyaqua_partner_points_ledger');
    let pointsList: PartnerPointTransaction[] = [];
    if (savedPoints) {
      try {
        pointsList = JSON.parse(savedPoints);
      } catch {
        pointsList = [];
      }
    }
    const newTx: PartnerPointTransaction = {
      id: `pt-${Date.now()}`,
      partner_id: effectivePartnerId,
      type: 'add',
      points: saleQty,
      avl_points: newAvlPoints,
      notes: saleNote,
      created_at: formatDateYMD(new Date()),
    };
    localStorage.setItem('plyaqua_partner_points_ledger', JSON.stringify([newTx, ...pointsList]));

    // Update partner profile in localStorage
    const savedPartners = localStorage.getItem('plyaqua_partners_data');
    if (savedPartners) {
      try {
        const partnersList = JSON.parse(savedPartners);
        const pIndex = partnersList.findIndex(
          (p: { id: string }) => p.id === effectivePartnerId
        );
        if (pIndex !== -1) {
          partnersList[pIndex].available_points = newAvlPoints;
          partnersList[pIndex].total_points = newTotalPoints;
          localStorage.setItem('plyaqua_partners_data', JSON.stringify(partnersList));
        }
      } catch {
        // ignore
      }
    }
  }

  if (isPlaceholderConfig()) {
    return { success: true, newAvailablePoints: newAvlPoints, error: null };
  }

  try {
    // 1. Decrease product quantity in partner_inventory
    const { data: invRow, error: fetchErr } = await supabase
      .from('partner_inventory')
      .select('id, qty')
      .eq('partner_id', effectivePartnerId)
      .eq('product_id', effectiveProductId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching partner_inventory before sale:', fetchErr.message);
    }

    if (invRow) {
      const remainingQty = Math.max(0, (Number(invRow.qty) || 0) - saleQty);
      const { error: updErr } = await supabase
        .from('partner_inventory')
        .update({ qty: remainingQty })
        .eq('id', invRow.id);

      if (updErr) {
        console.error('Error decreasing partner_inventory quantity:', updErr.message);
        return { success: false, error: new Error(`Failed to decrease inventory: ${updErr.message}`) };
      }
    } else {
      console.warn('Inventory record not found in Supabase for partner_id & product_id:', effectivePartnerId, effectiveProductId);
    }

    // 2. Insert into public.partner_points with type 'add'
    const { error: pointsErr } = await supabase.from('partner_points').insert({
      partner_id: effectivePartnerId,
      type: 'add',
      points: saleQty,
      avl_points: newAvlPoints,
      notes: saleNote,
    });

    if (pointsErr) {
      console.error('Error inserting into partner_points:', pointsErr.message);
      return { success: false, error: new Error(`Failed to record points transaction: ${pointsErr.message}`) };
    }

    // 3. Update public.partner_profile available_points and total_points
    const { error: profileErr } = await supabase
      .from('partner_profile')
      .update({
        available_points: newAvlPoints,
        total_points: newTotalPoints,
      })
      .eq('id', effectivePartnerId);

    if (profileErr) {
      console.error('Error updating partner_profile points:', profileErr.message);
      return { success: false, error: new Error(`Failed to update profile points: ${profileErr.message}`) };
    }

    return { success: true, newAvailablePoints: newAvlPoints, error: null };
  } catch (err: unknown) {
    console.error('Failed to complete sale transaction:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to record sale in Supabase'),
    };
  }
}

export async function getPartnerStockByPartnerId(partnerId: string, searchProdId?: string) {
  return getPartnerStock(searchProdId, partnerId);
}
