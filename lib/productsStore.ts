import { supabase } from './supabase';

export interface ProductSize {
  id: string;
  value: string;
  created_at?: string;
}

export interface Product {
  id: string;
  prod_id: string;
  name: string;
  size: string | null;
  size_value?: string;
  mrp: number;
  sp: number;
  qty: number;
  status: 'active' | 'deactive';
  created_at?: string;
}

const LOCAL_STORAGE_SIZES_KEY = 'plyaqua_sizes_data';
const LOCAL_STORAGE_PRODUCTS_KEY = 'plyaqua_products_data';

const initialDemoSizes: ProductSize[] = [
  { id: '44444444-4444-4444-4444-444444444401', value: '250ml' },
  { id: '44444444-4444-4444-4444-444444444402', value: '500ml' },
  { id: '44444444-4444-4444-4444-444444444403', value: '1000ml' },
  { id: '44444444-4444-4444-4444-444444444404', value: '20L' },
];

const initialDemoProducts: Product[] = [
  {
    id: '55555555-5555-5555-5555-555555555501',
    prod_id: 'prod_101',
    name: 'PlyAqua Pure Spring Water 500ml',
    size: '44444444-4444-4444-4444-444444444402',
    size_value: '500ml',
    mrp: 20.0,
    sp: 15.0,
    qty: 500,
    status: 'active',
  },
  {
    id: '55555555-5555-5555-5555-555555555502',
    prod_id: 'prod_102',
    name: 'PlyAqua Mineral Water 1000ml',
    size: '44444444-4444-4444-4444-444444444403',
    size_value: '1000ml',
    mrp: 35.0,
    sp: 28.0,
    qty: 320,
    status: 'active',
  },
  {
    id: '55555555-5555-5555-5555-555555555503',
    prod_id: 'prod_103',
    name: 'PlyAqua Commercial Dispenser Jar 20L',
    size: '44444444-4444-4444-4444-444444444404',
    size_value: '20L',
    mrp: 120.0,
    sp: 95.0,
    qty: 75,
    status: 'active',
  },
  {
    id: '55555555-5555-5555-5555-555555555504',
    prod_id: 'prod_104',
    name: 'PlyAqua Pocket Edition 250ml',
    size: '44444444-4444-4444-4444-444444444401',
    size_value: '250ml',
    mrp: 12.0,
    sp: 10.0,
    qty: 0,
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

const getLocalSizes = (): ProductSize[] => {
  if (typeof window === 'undefined') return initialDemoSizes;
  const saved = localStorage.getItem(LOCAL_STORAGE_SIZES_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_SIZES_KEY, JSON.stringify(initialDemoSizes));
    return initialDemoSizes;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoSizes;
  }
};

const setLocalSizes = (sizes: ProductSize[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_SIZES_KEY, JSON.stringify(sizes));
};

const getLocalProducts = (): Product[] => {
  if (typeof window === 'undefined') return initialDemoProducts;
  const saved = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(initialDemoProducts));
    return initialDemoProducts;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoProducts;
  }
};

const setLocalProducts = (products: Product[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
};

/**
 * Calculates auto-fill formula: prod_101 + length of products
 */
export function calculateNextProductId(currentLength: number): string {
  return `prod_${101 + currentLength}`;
}

/* =========================================================================
   Sizes Supabase Functions
   ========================================================================= */

/**
 * Fetch all product sizes from public.sizes
 */
export async function getSizes(): Promise<{
  data: ProductSize[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    return { data: getLocalSizes(), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('sizes')
      .select('*')
      .order('value', { ascending: true });

    if (error) {
      console.warn('Supabase sizes fetch error, using local state:', error.message);
      return { data: getLocalSizes(), error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    setLocalSizes(data);
    return { data, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalSizes(),
      error: err instanceof Error ? err : new Error('Failed to fetch sizes'),
    };
  }
}

/**
 * Add a new packaging size into public.sizes
 */
export async function createSize(value: string): Promise<{
  data: ProductSize | null;
  error: Error | null;
}> {
  const current = getLocalSizes();
  const newLocalSize: ProductSize = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-size-${Date.now()}`,
    value: value.trim(),
  };

  if (isPlaceholderConfig()) {
    const updated = [...current, newLocalSize];
    setLocalSizes(updated);
    return { data: newLocalSize, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('sizes')
      .insert({ value: value.trim() })
      .select()
      .single();

    if (error) {
      const updated = [...current, newLocalSize];
      setLocalSizes(updated);
      return { data: newLocalSize, error: null };
    }

    setLocalSizes([...current, data]);
    return { data, error: null };
  } catch (err: unknown) {
    const updated = [...current, newLocalSize];
    setLocalSizes(updated);
    return {
      data: newLocalSize,
      error: err instanceof Error ? err : new Error('Failed to create size'),
    };
  }
}

/**
 * Update an existing packaging size in public.sizes
 */
export async function updateSize(
  id: string,
  value: string
): Promise<{
  data: ProductSize | null;
  error: Error | null;
}> {
  const current = getLocalSizes();
  const localIndex = current.findIndex((s) => s.id === id);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = { ...current[localIndex], value: value.trim() };
      setLocalSizes(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Size not found') };
  }

  try {
    const { data, error } = await supabase
      .from('sizes')
      .update({ value: value.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (localIndex !== -1) {
        current[localIndex] = { ...current[localIndex], value: value.trim() };
        setLocalSizes(current);
        return { data: current[localIndex], error: null };
      }
      return { data: null, error: new Error(error.message) };
    }

    if (localIndex !== -1) {
      current[localIndex] = data;
      setLocalSizes(current);
    }
    return { data, error: null };
  } catch (err: unknown) {
    if (localIndex !== -1) {
      current[localIndex] = { ...current[localIndex], value: value.trim() };
      setLocalSizes(current);
      return { data: current[localIndex], error: null };
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update size'),
    };
  }
}

/* =========================================================================
   Products Supabase Functions
   ========================================================================= */

/**
 * Fetch all products from public.products (with resolved size value)
 */
export async function getProducts(): Promise<{
  data: Product[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    const products = getLocalProducts();
    const sizes = getLocalSizes();
    const sizeMap = new Map<string, string>();
    sizes.forEach((s) => sizeMap.set(s.id, s.value));

    const enriched = products.map((p, idx) => ({
      ...p,
      prod_id: p.prod_id || calculateNextProductId(idx),
      size_value: p.size ? sizeMap.get(p.size) || 'Standard' : '—',
    }));
    return { data: enriched, error: null };
  }

  try {
    const [productsRes, sizesRes] = await Promise.all([
      supabase.from('products').select('*').order('prod_id', { ascending: true }),
      getSizes(),
    ]);

    if (productsRes.error) {
      console.warn('Supabase products fetch error, using local fallback:', productsRes.error.message);
      return { data: getLocalProducts(), error: null };
    }

    if (!productsRes.data || productsRes.data.length === 0) {
      return { data: [], error: null };
    }

    const sizeMap = new Map<string, string>();
    sizesRes.data.forEach((s) => sizeMap.set(s.id, s.value));

    const formatted: Product[] = productsRes.data.map((p, index) => ({
      id: p.id,
      prod_id: p.prod_id || calculateNextProductId(index),
      name: p.name,
      size: p.size,
      size_value: p.size ? sizeMap.get(p.size) || 'Standard' : '—',
      mrp: Number(p.mrp) || 0,
      sp: Number(p.sp) || 0,
      qty: Number(p.qty) || 0,
      status: (p.status as 'active' | 'deactive') || 'active',
      created_at: p.created_at,
    }));

    setLocalProducts(formatted);
    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalProducts(),
      error: err instanceof Error ? err : new Error('Failed to fetch products'),
    };
  }
}

/**
 * Create a new product in public.products
 */
export async function createProduct(params: {
  prod_id: string;
  name: string;
  size: string | null;
  mrp: number;
  sp: number;
  qty: number;
  status: 'active' | 'deactive';
}): Promise<{
  data: Product | null;
  error: Error | null;
}> {
  const current = getLocalProducts();
  const sizes = getLocalSizes();
  const sizeObj = sizes.find((s) => s.id === params.size);

  const newLocalProduct: Product = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-prod-${Date.now()}`,
    prod_id: params.prod_id,
    name: params.name,
    size: params.size,
    size_value: sizeObj ? sizeObj.value : '—',
    mrp: Number(params.mrp) || 0,
    sp: Number(params.sp) || 0,
    qty: Number(params.qty) || 0,
    status: params.status || 'active',
  };

  if (isPlaceholderConfig()) {
    const updated = [...current, newLocalProduct];
    setLocalProducts(updated);
    return { data: newLocalProduct, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        prod_id: params.prod_id,
        name: params.name,
        size: params.size,
        mrp: Number(params.mrp) || 0,
        sp: Number(params.sp) || 0,
        qty: Number(params.qty) || 0,
        status: params.status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase product insert error, using local fallback:', error.message);
      const updated = [...current, newLocalProduct];
      setLocalProducts(updated);
      return { data: newLocalProduct, error: null };
    }

    const created: Product = {
      id: data.id,
      prod_id: data.prod_id,
      name: data.name,
      size: data.size,
      size_value: sizeObj ? sizeObj.value : '—',
      mrp: Number(data.mrp) || 0,
      sp: Number(data.sp) || 0,
      qty: Number(data.qty) || 0,
      status: data.status,
    };

    setLocalProducts([...current, created]);
    return { data: created, error: null };
  } catch (err: unknown) {
    const updated = [...current, newLocalProduct];
    setLocalProducts(updated);
    return {
      data: newLocalProduct,
      error: err instanceof Error ? err : new Error('Failed to create product'),
    };
  }
}

/**
 * Update product in public.products (all fields except prod_id)
 */
export async function updateProduct(
  id: string,
  updates: {
    name: string;
    size: string | null;
    mrp: number;
    sp: number;
    qty: number;
    status: 'active' | 'deactive';
  }
): Promise<{
  data: Product | null;
  error: Error | null;
}> {
  const current = getLocalProducts();
  const localIndex = current.findIndex((p) => p.id === id);
  const sizes = getLocalSizes();
  const sizeObj = sizes.find((s) => s.id === updates.size);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
        size_value: sizeObj ? sizeObj.value : '—',
        mrp: Number(updates.mrp) || 0,
        sp: Number(updates.sp) || 0,
        qty: Number(updates.qty) || 0,
      };
      setLocalProducts(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Product not found') };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        size: updates.size,
        mrp: Number(updates.mrp) || 0,
        sp: Number(updates.sp) || 0,
        qty: Number(updates.qty) || 0,
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (localIndex !== -1) {
        current[localIndex] = {
          ...current[localIndex],
          ...updates,
          size_value: sizeObj ? sizeObj.value : '—',
        };
        setLocalProducts(current);
        return { data: current[localIndex], error: null };
      }
      return { data: null, error: new Error(error.message) };
    }

    const updatedProduct: Product = {
      id: data.id,
      prod_id: data.prod_id || (localIndex !== -1 ? current[localIndex].prod_id : calculateNextProductId(0)),
      name: data.name,
      size: data.size,
      size_value: sizeObj ? sizeObj.value : '—',
      mrp: Number(data.mrp) || 0,
      sp: Number(data.sp) || 0,
      qty: Number(data.qty) || 0,
      status: data.status,
    };

    if (localIndex !== -1) {
      current[localIndex] = updatedProduct;
      setLocalProducts(current);
    }

    return { data: updatedProduct, error: null };
  } catch (err: unknown) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
        size_value: sizeObj ? sizeObj.value : '—',
      };
      setLocalProducts(current);
      return { data: current[localIndex], error: null };
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update product'),
    };
  }
}
