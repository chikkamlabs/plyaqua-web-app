import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type PartnerPointReqStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface PartnerPointReq {
  id: string;
  partner_id: string;
  partner_code?: string;
  partner_name?: string;
  partner_mobile?: string;
  partner_email?: string;
  partner_available_points?: number;
  points: number;
  status: PartnerPointReqStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerPointReqFilters {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  search?: string; // partner name or mobile
}

export interface AdminPartnerPointsSummary {
  id: string;
  partner_id: string;
  name: string;
  email: string;
  mobile: string;
  partner_category_name?: string;
  address: string;
  status: string;
  total_points: number;
  available_points: number;
}

export interface PartnerPointRecord {
  id: string;
  partner_id: string;
  type: 'add' | 'delete';
  points: number;
  avl_points: number;
  notes?: string | null;
  created_at: string;
}

const LOCAL_REQS_KEY = 'plyaqua_partner_points_reqs_data';
const LOCAL_POINTS_KEY = 'plyaqua_partner_points_ledger';
const LOCAL_PARTNERS_KEY = 'plyaqua_partners_data';

export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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

const initialDemoPartnerReqs: PartnerPointReq[] = [
  {
    id: 'ppr-001',
    partner_id: '22222222-2222-2222-2222-222222222201',
    partner_code: 'partner_101',
    partner_name: 'Aqua Wave Logistics',
    partner_mobile: '+1 (555) 234-5678',
    partner_email: 'aquawave@plyaqua.com',
    partner_available_points: 2450,
    points: 500,
    status: 'pending',
    notes: 'Partner requested points redemption for monthly invoice credit',
    created_at: `${formatDateYMD(new Date())}T09:30:00.000Z`,
    updated_at: `${formatDateYMD(new Date())}T09:30:00.000Z`,
  },
  {
    id: 'ppr-002',
    partner_id: '22222222-2222-2222-2222-222222222202',
    partner_code: 'partner_102',
    partner_name: 'Metro Springs Mart',
    partner_mobile: '+1 (555) 876-5432',
    partner_email: 'metrosprings@plyaqua.com',
    partner_available_points: 1200,
    points: 200,
    status: 'processing',
    notes: 'Processing promotional voucher redemption',
    created_at: `${formatDateYMD(new Date())}T11:15:00.000Z`,
    updated_at: `${formatDateYMD(new Date())}T11:20:00.000Z`,
  },
];

const getLocalPartnerReqs = (): PartnerPointReq[] => {
  if (typeof window === 'undefined') return initialDemoPartnerReqs;
  const saved = localStorage.getItem(LOCAL_REQS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_REQS_KEY, JSON.stringify(initialDemoPartnerReqs));
    return initialDemoPartnerReqs;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoPartnerReqs;
  }
};

const setLocalPartnerReqs = (reqs: PartnerPointReq[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_REQS_KEY, JSON.stringify(reqs));
};

/**
 * Fetch partner_points_reqs joined with partner_profile and users details,
 * filtered by date range and search query (partner name or mobile).
 */
export async function getPartnerPointReqs(filters?: PartnerPointReqFilters): Promise<{
  data: PartnerPointReq[];
  totalFilteredCount: number;
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalPartnerReqs();

    if (filters?.fromDate) {
      list = list.filter((r) => r.created_at.split('T')[0] >= filters.fromDate!);
    }
    if (filters?.toDate) {
      list = list.filter((r) => r.created_at.split('T')[0] <= filters.toDate!);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.partner_name || '').toLowerCase().includes(q) ||
          (r.partner_mobile || '').toLowerCase().includes(q) ||
          (r.partner_code || '').toLowerCase().includes(q)
      );
    }

    return { data: list, totalFilteredCount: list.length, error: null };
  }

  try {
    let query = supabase
      .from('partner_points_reqs')
      .select('id, partner_id, points, status, notes, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      query = query.gte('created_at', `${filters.fromDate}T00:00:00.000Z`);
    }
    if (filters?.toDate) {
      query = query.lte('created_at', `${filters.toDate}T23:59:59.999Z`);
    }

    const { data: reqRows, error: reqError } = await query;

    if (reqError) {
      return {
        data: [],
        totalFilteredCount: 0,
        error: new Error(reqError.message),
      };
    }

    if (!reqRows || reqRows.length === 0) {
      return { data: [], totalFilteredCount: 0, error: null };
    }

    const partnerIds = Array.from(new Set(reqRows.map((r) => r.partner_id)));

    const [{ data: profiles }, { data: usersData }] = await Promise.all([
      supabase
        .from('partner_profile')
        .select('id, partner_id, available_points')
        .in('id', partnerIds),
      supabase
        .from('users')
        .select('id, name, email, mobile')
        .in('id', partnerIds),
    ]);

    const profileMap = new Map<
      string,
      { partner_id: string; available_points: number }
    >();
    (profiles || []).forEach((p) => {
      profileMap.set(p.id, {
        partner_id: p.partner_id || '',
        available_points: Number(p.available_points) || 0,
      });
    });

    const userMap = new Map<
      string,
      { name: string; email: string; mobile: string }
    >();
    (usersData || []).forEach((u) => {
      userMap.set(u.id, {
        name: u.name || 'Partner',
        email: u.email || '',
        mobile: u.mobile || '',
      });
    });

    let mapped: PartnerPointReq[] = reqRows.map((row) => {
      const prof = profileMap.get(row.partner_id);
      const usr = userMap.get(row.partner_id);
      return {
        id: row.id,
        partner_id: row.partner_id,
        partner_code: prof?.partner_id || '',
        partner_name: usr?.name || 'Partner',
        partner_mobile: usr?.mobile || '',
        partner_email: usr?.email || '',
        partner_available_points: prof?.available_points ?? 0,
        points: Number(row.points) || 0,
        status: row.status as PartnerPointReqStatus,
        notes: row.notes || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      mapped = mapped.filter(
        (r) =>
          (r.partner_name || '').toLowerCase().includes(q) ||
          (r.partner_mobile || '').toLowerCase().includes(q) ||
          (r.partner_code || '').toLowerCase().includes(q)
      );
    }

    return {
      data: mapped,
      totalFilteredCount: mapped.length,
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: [],
      totalFilteredCount: 0,
      error: err instanceof Error ? err : new Error('Failed to load partner points requests'),
    };
  }
}

/**
 * Updates a partner point request's status and notes.
 * Does NOT allow saving if the request is already completed.
 * When saving with status === 'completed', inserts into partner_points (type='delete', points, avl_points)
 * and updates partner_profile.available_points = partner_profile.available_points - points.
 */
export async function updatePartnerPointReq(
  id: string,
  params: {
    status: PartnerPointReqStatus;
    notes?: string;
    points: number;
    partner_id: string;
    previousStatus?: PartnerPointReqStatus;
  }
): Promise<{
  success: boolean;
  updatedAvailablePoints?: number;
  error: Error | null;
}> {
  if (params.previousStatus === 'completed') {
    return {
      success: false,
      error: new Error('Completed requests cannot be modified or saved again.'),
    };
  }

  const now = new Date().toISOString();

  if (isPlaceholderConfig()) {
    const localList = getLocalPartnerReqs();
    const index = localList.findIndex((item) => item.id === id);
    if (index !== -1 && localList[index].status === 'completed') {
      return {
        success: false,
        error: new Error('Completed requests cannot be modified or saved again.'),
      };
    }

    let nextAvl: number | undefined;
    if (params.status === 'completed' && typeof window !== 'undefined') {
      const partnersRaw = localStorage.getItem(LOCAL_PARTNERS_KEY);
      if (partnersRaw) {
        try {
          const partners = JSON.parse(partnersRaw);
          const pIdx = partners.findIndex((p: { id: string }) => p.id === params.partner_id);
          if (pIdx !== -1) {
            nextAvl = Math.max(
              0,
              Number(partners[pIdx].available_points || 0) - Number(params.points || 0)
            );
            partners[pIdx].available_points = nextAvl;
            localStorage.setItem(LOCAL_PARTNERS_KEY, JSON.stringify(partners));
          }
        } catch {
          // ignore
        }
      }

      const ledgerRaw = localStorage.getItem(LOCAL_POINTS_KEY);
      try {
        const ledger = ledgerRaw ? JSON.parse(ledgerRaw) : [];
        const computedAvl = nextAvl ?? 0;
        ledger.unshift({
          id: `pt-${Date.now()}`,
          partner_id: params.partner_id,
          type: 'delete',
          points: params.points,
          avl_points: computedAvl,
          notes: params.notes?.trim() || 'Partner points redemption completed',
          created_at: formatDateYMD(new Date()),
        });
        localStorage.setItem(LOCAL_POINTS_KEY, JSON.stringify(ledger));
      } catch {
        // ignore
      }
    }

    if (index !== -1) {
      localList[index] = {
        ...localList[index],
        status: params.status,
        notes: params.notes !== undefined ? params.notes : localList[index].notes,
        partner_available_points:
          nextAvl !== undefined ? nextAvl : localList[index].partner_available_points,
        updated_at: now,
      };
      setLocalPartnerReqs(localList);
    }

    return { success: true, updatedAvailablePoints: nextAvl, error: null };
  }

  try {
    // Verify current database status is not already completed
    const { data: existingReq, error: fetchErr } = await supabase
      .from('partner_points_reqs')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: new Error(fetchErr.message) };
    }
    if (existingReq?.status === 'completed') {
      return {
        success: false,
        error: new Error('Completed requests cannot be modified or saved again.'),
      };
    }

    // 1. Update partner_points_reqs row
    const { error: updateErr } = await supabase
      .from('partner_points_reqs')
      .update({
        status: params.status,
        notes: params.notes?.trim() ? params.notes.trim() : null,
        updated_at: now,
      })
      .eq('id', id);

    if (updateErr) {
      return { success: false, error: new Error(updateErr.message) };
    }

    let updatedAvailablePoints: number | undefined;

    // 2. If status is completed, insert into partner_points (type='delete') and decrement partner_profile.available_points
    if (params.status === 'completed') {
      const { data: profileData, error: profileErr } = await supabase
        .from('partner_profile')
        .select('available_points')
        .eq('id', params.partner_id)
        .single();

      if (profileErr) {
        return {
          success: false,
          error: new Error(`Request saved, but failed to load partner balance: ${profileErr.message}`),
        };
      }

      const currentAvl = Number(profileData?.available_points) || 0;
      const newAvlPoints = Math.max(0, currentAvl - (Number(params.points) || 0));
      updatedAvailablePoints = newAvlPoints;

      const { error: ledgerErr } = await supabase.from('partner_points').insert([
        {
          partner_id: params.partner_id,
          type: 'delete',
          points: Number(params.points) || 0,
          avl_points: newAvlPoints,
          notes: params.notes?.trim()
            ? params.notes.trim()
            : 'Partner points redemption request completed',
          created_at: now,
          updated_at: now,
        },
      ]);

      if (ledgerErr) {
        return {
          success: false,
          error: new Error(`Failed to record partner_points entry: ${ledgerErr.message}`),
        };
      }

      const { error: updateProfileErr } = await supabase
        .from('partner_profile')
        .update({
          available_points: newAvlPoints,
          updated_at: now,
        })
        .eq('id', params.partner_id);

      if (updateProfileErr) {
        return {
          success: false,
          error: new Error(`Failed to update partner available_points: ${updateProfileErr.message}`),
        };
      }
    }

    return {
      success: true,
      updatedAvailablePoints,
      error: null,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to update partner points request'),
    };
  }
}

export interface PartnerPointsLedgerFilters {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

/**
 * Fetch partner profile summary (total_points, available_points) and partner_points ledger
 * for admin view at app/admin/partners/points/page.tsx
 */
export async function getAdminPartnerPointsData(
  partnerId: string,
  filters?: PartnerPointsLedgerFilters
): Promise<{
  partner: AdminPartnerPointsSummary | null;
  transactions: PartnerPointRecord[];
  error: Error | null;
}> {
  if (!partnerId) {
    return {
      partner: null,
      transactions: [],
      error: new Error('No partner ID provided.'),
    };
  }

  if (isPlaceholderConfig()) {
    let demoPartner: AdminPartnerPointsSummary | null = null;
    let demoTx: PartnerPointRecord[] = [];

    if (typeof window !== 'undefined') {
      try {
        const partnersRaw = localStorage.getItem(LOCAL_PARTNERS_KEY);
        if (partnersRaw) {
          const parsed = JSON.parse(partnersRaw);
          const found = parsed.find(
            (p: { id: string; partner_id: string }) =>
              p.id === partnerId || p.partner_id === partnerId
          );
          if (found) {
            demoPartner = {
              id: found.id,
              partner_id: found.partner_id,
              name: found.name,
              email: found.email || '',
              mobile: found.mobile || '',
              partner_category_name: found.partner_category_name || 'General',
              address: found.address || '',
              status: found.status || 'active',
              total_points: Number(found.total_points) || 0,
              available_points: Number(found.available_points) || 0,
            };
          }
        }

        const ledgerRaw = localStorage.getItem(LOCAL_POINTS_KEY);
        if (ledgerRaw) {
          const parsedTx = JSON.parse(ledgerRaw);
          demoTx = parsedTx.filter(
            (t: PartnerPointRecord) =>
              t.partner_id === (demoPartner?.id || partnerId)
          );
        }
      } catch {
        // ignore
      }
    }

    if (filters?.fromDate) {
      demoTx = demoTx.filter(
        (t) => (t.created_at || '').split('T')[0] >= filters.fromDate!
      );
    }
    if (filters?.toDate) {
      demoTx = demoTx.filter(
        (t) => (t.created_at || '').split('T')[0] <= filters.toDate!
      );
    }

    return { partner: demoPartner, transactions: demoTx, error: null };
  }

  try {
    // 1. Fetch partner_profile by UUID or partner_id code
    let { data: profile, error: profErr } = await supabase
      .from('partner_profile')
      .select('id, partner_id, address, available_points, total_points, partner_category, status')
      .eq('id', partnerId)
      .maybeSingle();

    if (!profile && !profErr) {
      const fallbackByCode = await supabase
        .from('partner_profile')
        .select('id, partner_id, address, available_points, total_points, partner_category, status')
        .eq('partner_id', partnerId)
        .maybeSingle();
      profile = fallbackByCode.data;
      profErr = fallbackByCode.error;
    }

    if (profErr) {
      return { partner: null, transactions: [], error: new Error(profErr.message) };
    }

    if (!profile) {
      return {
        partner: null,
        transactions: [],
        error: new Error('Partner record not found.'),
      };
    }

    // 2. Build filtered partner_points query
    let pointsQuery = supabase
      .from('partner_points')
      .select('id, partner_id, type, points, avl_points, notes, created_at')
      .eq('partner_id', profile.id)
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      pointsQuery = pointsQuery.gte('created_at', `${filters.fromDate}T00:00:00.000Z`);
    }
    if (filters?.toDate) {
      pointsQuery = pointsQuery.lte('created_at', `${filters.toDate}T23:59:59.999Z`);
    }

    // 3. Fetch user info, category name, and partner_points ledger
    const [{ data: userData }, categoryRes, { data: pointsRows, error: pointsErr }] =
      await Promise.all([
        supabase
          .from('users')
          .select('id, name, email, mobile')
          .eq('id', profile.id)
          .maybeSingle(),
        profile.partner_category
          ? supabase
              .from('partner_categories')
              .select('name')
              .eq('id', profile.partner_category)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        pointsQuery,
      ]);

    if (pointsErr) {
      return {
        partner: null,
        transactions: [],
        error: new Error(pointsErr.message),
      };
    }

    const summary: AdminPartnerPointsSummary = {
      id: profile.id,
      partner_id: profile.partner_id || profile.id,
      name: userData?.name || 'Partner',
      email: userData?.email || '',
      mobile: userData?.mobile || '',
      partner_category_name: categoryRes.data?.name || 'General',
      address: profile.address || '',
      status: profile.status || 'active',
      total_points: Number(profile.total_points) || 0,
      available_points: Number(profile.available_points) || 0,
    };

    const transactions: PartnerPointRecord[] = (pointsRows || []).map((row) => ({
      id: row.id,
      partner_id: row.partner_id,
      type: (row.type as 'add' | 'delete') || 'add',
      points: Number(row.points) || 0,
      avl_points: Number(row.avl_points) || 0,
      notes: row.notes || null,
      created_at: row.created_at,
    }));

    return {
      partner: summary,
      transactions,
      error: null,
    };
  } catch (err: unknown) {
    return {
      partner: null,
      transactions: [],
      error: err instanceof Error ? err : new Error('Failed to load partner points data'),
    };
  }
}

/**
 * Fetch partner_points_reqs for the currently signed-in partner.
 */
export async function getMyPartnerPointReqs(): Promise<{
  data: PartnerPointReq[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    const user = await getCurrentUser();
    const list = getLocalPartnerReqs().filter(
      (r) =>
        !user?.id ||
        r.partner_id === user.id ||
        r.partner_id === '22222222-2222-2222-2222-222222222201'
    );
    list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { data: list, error: null };
  }

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const user = authUser || (await getCurrentUser());

    if (!user?.id) {
      return { data: [], error: new Error('Unable to identify signed-in partner.') };
    }

    const { data, error } = await supabase
      .from('partner_points_reqs')
      .select('id, partner_id, points, status, notes, created_at, updated_at')
      .eq('partner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    const mapped: PartnerPointReq[] = (data || []).map((row) => ({
      id: row.id,
      partner_id: row.partner_id,
      points: Number(row.points) || 0,
      status: row.status as PartnerPointReqStatus,
      notes: row.notes || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return { data: mapped, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err
          : new Error('Failed to load partner points requests'),
    };
  }
}

/**
 * Insert a new partner point redemption request into public.partner_points_reqs.
 */
export async function createPartnerPointReq(input: {
  points: number;
  notes?: string;
}): Promise<{
  data: PartnerPointReq | null;
  error: Error | null;
}> {
  const requestedPoints = Math.floor(Number(input.points));
  if (!Number.isFinite(requestedPoints) || requestedPoints <= 0) {
    return {
      data: null,
      error: new Error('Please enter a valid number of points greater than 0.'),
    };
  }

  const trimmedNotes = input.notes?.trim() ? input.notes.trim() : null;
  const now = new Date().toISOString();

  if (isPlaceholderConfig()) {
    const user = await getCurrentUser();
    const partnerId = user?.id || '22222222-2222-2222-2222-222222222201';
    const newReq: PartnerPointReq = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ppr-${Date.now()}`,
      partner_id: partnerId,
      partner_name: user?.user_metadata?.name || 'Partner',
      points: requestedPoints,
      status: 'pending',
      notes: trimmedNotes,
      created_at: now,
      updated_at: now,
    };
    const existing = getLocalPartnerReqs();
    setLocalPartnerReqs([newReq, ...existing]);
    return { data: newReq, error: null };
  }

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const user = authUser || (await getCurrentUser());

    if (!user?.id) {
      return {
        data: null,
        error: new Error('You must be signed in as a partner to redeem points.'),
      };
    }

    const { data: profile, error: profErr } = await supabase
      .from('partner_profile')
      .select('available_points')
      .eq('id', user.id)
      .maybeSingle();

    if (profErr) {
      return { data: null, error: new Error(profErr.message) };
    }

    if (profile && requestedPoints > (Number(profile.available_points) || 0)) {
      return {
        data: null,
        error: new Error(
          `Requested points (${requestedPoints.toLocaleString()}) cannot exceed available points (${(Number(profile.available_points) || 0).toLocaleString()}).`
        ),
      };
    }

    const { data, error } = await supabase
      .from('partner_points_reqs')
      .insert({
        partner_id: user.id,
        points: requestedPoints,
        status: 'pending',
        notes: trimmedNotes,
      })
      .select('id, partner_id, points, status, notes, created_at, updated_at')
      .single();

    if (error || !data) {
      return {
        data: null,
        error: new Error(error?.message || 'Failed to submit points redemption request.'),
      };
    }

    return {
      data: {
        id: data.id,
        partner_id: data.partner_id,
        points: Number(data.points) || 0,
        status: data.status as PartnerPointReqStatus,
        notes: data.notes || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error('Failed to submit points redemption request'),
    };
  }
}
