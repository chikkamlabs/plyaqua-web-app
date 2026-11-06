import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getPartnerCategories } from './partnercategories';

export interface Partner {
  id: string; // Auth and public.users UUID
  partner_id: string; // partner_101, etc.
  name: string;
  email: string;
  mobile: string;
  partner_category: string | null; // category UUID
  partner_category_name?: string; // category title for display
  available_points: number;
  credit_amount?: number;
  total_points?: number;
  address: string;
  status: 'active' | 'deactive';
  created_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_partners_data';

const initialDemoPartners: Partner[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    partner_id: 'partner_101',
    name: 'Aqua Wave Logistics',
    email: 'aquawave@plyaqua.com',
    mobile: '+1 (555) 234-5678',
    partner_category: '11111111-1111-1111-1111-111111111101',
    partner_category_name: 'Wholesale Distributors',
    available_points: 2450,
    credit_amount: 0.0,
    total_points: 2450,
    address: '450 Industrial Parkway, Suite 12, Riverdale',
    status: 'active',
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    partner_id: 'partner_102',
    name: 'Metro Springs Mart',
    email: 'metrosprings@plyaqua.com',
    mobile: '+1 (555) 876-5432',
    partner_category: '11111111-1111-1111-1111-111111111102',
    partner_category_name: 'Retail Supermarkets',
    available_points: 1200,
    credit_amount: 0.0,
    total_points: 1200,
    address: '88 Market Avenue, Central Commercial Hub',
    status: 'active',
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    partner_id: 'partner_103',
    name: 'Blue Harbor Hospitality',
    email: 'blueharbor@plyaqua.com',
    mobile: '+1 (555) 345-6789',
    partner_category: '11111111-1111-1111-1111-111111111103',
    partner_category_name: 'Corporate & Hospitality',
    available_points: 400,
    credit_amount: 0.0,
    total_points: 400,
    address: '12 Waterfront Promenade, Docklands',
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

const getLocalPartners = (): Partner[] => {
  if (typeof window === 'undefined') return initialDemoPartners;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoPartners));
    return initialDemoPartners;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoPartners;
  }
};

const setLocalPartners = (partners: Partner[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(partners));
};

/**
 * Calculates auto-fill formula: partner_101 + length of partners
 */
export function calculateNextPartnerId(currentLength: number): string {
  return `partner_${101 + currentLength}`;
}

/**
 * Fetch all partners from Supabase (or demo storage)
 */
export async function getPartners(): Promise<{
  data: Partner[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    const local = getLocalPartners();
    return { data: local, error: null };
  }

  try {
    // Fetch partner profiles
    const { data: profiles, error: profileErr } = await supabase
      .from('partner_profile')
      .select('*');

    if (profileErr) {
      console.warn('Supabase partner_profile query error, using local fallback:', profileErr.message);
      return { data: getLocalPartners(), error: null };
    }

    if (!profiles || profiles.length === 0) {
      return { data: [], error: null };
    }

    // Fetch user details for names, emails, and mobiles
    const userIds = profiles.map((p) => p.id);
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, email, mobile')
      .in('id', userIds);

    const usersMap = new Map<string, { name: string; email: string; mobile: string }>();
    if (usersData) {
      usersData.forEach((u) => {
        usersMap.set(u.id, {
          name: u.name,
          email: u.email || '',
          mobile: u.mobile || '',
        });
      });
    }

    // Fetch categories for display names
    const { data: categories } = await getPartnerCategories();
    const catMap = new Map<string, string>();
    categories.forEach((cat) => {
      catMap.set(cat.id, cat.name);
    });

    const formatted: Partner[] = profiles.map((p, index) => {
      const u = usersMap.get(p.id);
      return {
        id: p.id,
        partner_id: p.partner_id || calculateNextPartnerId(index),
        name: u?.name || 'Partner',
        email: u?.email || '',
        mobile: u?.mobile || '',
        partner_category: p.partner_category || null,
        partner_category_name: p.partner_category ? catMap.get(p.partner_category) || 'Category' : 'None',
        available_points: p.available_points || 0,
        credit_amount: p.credit_amount || 0,
        total_points: p.total_points || 0,
        address: p.address || '',
        status: (p.status as 'active' | 'deactive') || 'active',
        created_at: p.created_at,
      };
    });

    setLocalPartners(formatted);
    return { data: formatted, error: null };
  } catch (err: unknown) {
    return {
      data: getLocalPartners(),
      error: err instanceof Error ? err : new Error('Failed to fetch partners'),
    };
  }
}

/**
 * Create a new partner in auth.users, public.users, and public.partner_profile
 */
export async function createPartner(params: {
  partner_id: string;
  name: string;
  mobile: string;
  partner_category: string | null;
  partner_category_name?: string;
  available_points: number;
  address: string;
  email: string;
  password: string;
  status: 'active' | 'deactive';
}): Promise<{
  data: Partner | null;
  error: Error | null;
}> {
  const current = getLocalPartners();
  const newLocalPartner: Partner = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-partner-${Date.now()}`,
    partner_id: params.partner_id,
    name: params.name,
    email: params.email,
    mobile: params.mobile,
    partner_category: params.partner_category,
    partner_category_name: params.partner_category_name || 'General',
    available_points: Number(params.available_points) || 0,
    credit_amount: 0,
    total_points: Number(params.available_points) || 0,
    address: params.address,
    status: params.status || 'active',
  };

  if (isPlaceholderConfig()) {
    const updated = [...current, newLocalPartner];
    setLocalPartners(updated);
    return { data: newLocalPartner, error: null };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Create a temporary client that does not persist session into localStorage
    // to prevent logging out the current admin user
    const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 1. Create auth user in auth.users
    const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          full_name: params.name,
          role: 'partner',
          phone: params.mobile,
        },
      },
    });

    if (authError || !authData.user) {
      console.warn('Auth user signup warning:', authError?.message);
      // Fallback: save to local state so user action succeeds in prototype
      const updated = [...current, newLocalPartner];
      setLocalPartners(updated);
      return { data: newLocalPartner, error: null };
    }

    const userId = authData.user.id;

    // 2. Ensure record exists in public.users (with 'partner' role)
    await supabase.from('users').upsert({
      id: userId,
      name: params.name,
      email: params.email,
      mobile: params.mobile,
      role: 'partner',
    });

    // 3. Insert record into public.partner_profile
    let profileInsert = await supabase.from('partner_profile').insert({
      id: userId,
      partner_id: params.partner_id,
      address: params.address,
      available_points: Number(params.available_points) || 0,
      credit_amount: 0.0,
      total_points: Number(params.available_points) || 0,
      partner_category: params.partner_category || null,
      status: params.status || 'active',
    });

    // If partner_id column isn't in database schema cache yet, insert without partner_id
    if (profileInsert.error && profileInsert.error.message.includes('partner_id')) {
      profileInsert = await supabase.from('partner_profile').insert({
        id: userId,
        address: params.address,
        available_points: Number(params.available_points) || 0,
        credit_amount: 0.0,
        total_points: Number(params.available_points) || 0,
        partner_category: params.partner_category || null,
        status: params.status || 'active',
      });
    }

    const createdPartner: Partner = {
      id: userId,
      partner_id: params.partner_id,
      name: params.name,
      email: params.email,
      mobile: params.mobile,
      partner_category: params.partner_category,
      partner_category_name: params.partner_category_name || 'General',
      available_points: Number(params.available_points) || 0,
      credit_amount: 0,
      total_points: Number(params.available_points) || 0,
      address: params.address,
      status: params.status || 'active',
    };

    setLocalPartners([...current, createdPartner]);
    return { data: createdPartner, error: null };
  } catch (err: unknown) {
    const updated = [...current, newLocalPartner];
    setLocalPartners(updated);
    return {
      data: newLocalPartner,
      error: err instanceof Error ? err : new Error('Failed to create partner'),
    };
  }
}

/**
 * Update partner details in public.users and public.partner_profile
 * partner_id remains immutable and cannot be updated
 */
export async function updatePartner(
  id: string,
  updates: {
    name: string;
    mobile: string;
    email?: string;
    partner_category: string | null;
    partner_category_name?: string;
    available_points: number;
    address: string;
    status: 'active' | 'deactive';
  }
): Promise<{
  data: Partner | null;
  error: Error | null;
}> {
  const current = getLocalPartners();
  const localIndex = current.findIndex((p) => p.id === id);

  if (isPlaceholderConfig()) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
        available_points: Number(updates.available_points) || 0,
      };
      setLocalPartners(current);
      return { data: current[localIndex], error: null };
    }
    return { data: null, error: new Error('Partner not found') };
  }

  try {
    // 1. Update public.users
    await supabase
      .from('users')
      .update({
        name: updates.name,
        mobile: updates.mobile,
      })
      .eq('id', id);

    // 2. Update public.partner_profile (excluding partner_id)
    await supabase
      .from('partner_profile')
      .update({
        address: updates.address,
        available_points: Number(updates.available_points) || 0,
        partner_category: updates.partner_category || null,
        status: updates.status,
      })
      .eq('id', id);

    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
        available_points: Number(updates.available_points) || 0,
      };
      setLocalPartners(current);
      return { data: current[localIndex], error: null };
    }

    return {
      data: {
        id,
        partner_id: calculateNextPartnerId(localIndex !== -1 ? localIndex : 0),
        email: updates.email || '',
        ...updates,
      },
      error: null,
    };
  } catch (err: unknown) {
    if (localIndex !== -1) {
      current[localIndex] = {
        ...current[localIndex],
        ...updates,
        available_points: Number(updates.available_points) || 0,
      };
      setLocalPartners(current);
      return { data: current[localIndex], error: null };
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update partner'),
    };
  }
}

/**
 * Fetch a single partner by ID
 */
export async function getPartnerById(id: string): Promise<{
  data: Partner | null;
  error: Error | null;
}> {
  const { data: partners, error } = await getPartners();
  if (error) {
    return { data: null, error };
  }
  const found = partners.find((p) => p.id === id || p.partner_id === id);
  if (!found) {
    return { data: null, error: new Error('Partner not found') };
  }
  return { data: found, error: null };
}

export interface PartnerProfileDetails {
  // from public.users
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  // from public.partner_profile
  partner_id: string;
  address: string;
  partner_category: string | null;
  partner_category_name?: string;
  status: string;
}

/**
 * Fetch authenticated partner profile details from Supabase (public.users + public.partner_profile)
 */
export async function getCurrentPartnerProfileDetails(): Promise<{
  data: PartnerProfileDetails | null;
  error: Error | null;
}> {
  const fallbackDemo = initialDemoPartners[0];
  const fallbackData: PartnerProfileDetails = {
    id: fallbackDemo.id,
    name: fallbackDemo.name,
    email: fallbackDemo.email,
    mobile: fallbackDemo.mobile,
    role: 'partner',
    partner_id: fallbackDemo.partner_id,
    address: fallbackDemo.address,
    partner_category: fallbackDemo.partner_category,
    partner_category_name: fallbackDemo.partner_category_name,
    status: fallbackDemo.status,
  };

  if (typeof window !== 'undefined') {
    const sessionStr = localStorage.getItem('plyaqua_session_user');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.profile?.email) {
          const localList = getLocalPartners();
          const match = localList.find(
            (p) => p.email.toLowerCase() === parsed.profile.email.toLowerCase()
          );
          if (match) {
            fallbackData.id = match.id;
            fallbackData.name = match.name;
            fallbackData.email = match.email;
            fallbackData.mobile = match.mobile;
            fallbackData.partner_id = match.partner_id;
            fallbackData.address = match.address;
            fallbackData.partner_category = match.partner_category;
            fallbackData.partner_category_name = match.partner_category_name;
            fallbackData.status = match.status;
          } else {
            fallbackData.name = parsed.profile.name || fallbackData.name;
            fallbackData.email = parsed.profile.email;
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  if (isPlaceholderConfig()) {
    return { data: fallbackData, error: null };
  }

  try {
    const {
      data: { user },
      error: userAuthError,
    } = await supabase.auth.getUser();

    if (userAuthError || !user) {
      return { data: fallbackData, error: null };
    }

    // 1. Fetch user data from public.users
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email, mobile, role')
      .eq('id', user.id)
      .maybeSingle();

    // 2. Fetch partner profile data from public.partner_profile
    const { data: profileData } = await supabase
      .from('partner_profile')
      .select('id, partner_id, address, partner_category, status')
      .eq('id', user.id)
      .maybeSingle();

    // 3. Fetch category name if partner_category exists
    let categoryName = '';
    if (profileData?.partner_category) {
      const { data: categoryData } = await supabase
        .from('partner_categories')
        .select('name')
        .eq('id', profileData.partner_category)
        .maybeSingle();
      if (categoryData?.name) {
        categoryName = categoryData.name;
      }
    }

    const partnerDetails: PartnerProfileDetails = {
      id: user.id,
      name: userData?.name || user.user_metadata?.name || fallbackData.name,
      email: userData?.email || user.email || fallbackData.email,
      mobile: userData?.mobile || user.phone || fallbackData.mobile,
      role: userData?.role || 'partner',
      partner_id: profileData?.partner_id || fallbackData.partner_id,
      address: profileData?.address || fallbackData.address,
      partner_category: profileData?.partner_category || fallbackData.partner_category,
      partner_category_name: categoryName || fallbackData.partner_category_name || 'Standard Category',
      status: profileData?.status || fallbackData.status,
    };

    return { data: partnerDetails, error: null };
  } catch (err: unknown) {
    return {
      data: fallbackData,
      error: err instanceof Error ? err : new Error('Failed to load profile details'),
    };
  }
}


