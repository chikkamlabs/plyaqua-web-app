import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type PointsTransType = 'add' | 'delete';

export interface PartnerPointsSummary {
  partner_id: string;
  available_points: number;
  total_points: number;
}

export interface PartnerPointTransaction {
  id: string;
  partner_id: string;
  type: PointsTransType;
  points: number;
  avl_points: number;
  notes?: string | null;
  created_at: string; // YYYY-MM-DD or ISO
}

const LOCAL_POINTS_KEY = 'plyaqua_partner_points_ledger';

// Helper to format date as YYYY-MM-DD
export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Default filter: last one week (7 days ago to today)
export function getDefaultPointsDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    fromDate: formatDateYMD(sevenDaysAgo),
    toDate: formatDateYMD(today),
  };
}

const initialDemoTransactions: PartnerPointTransaction[] = [
  {
    id: 'pt-101',
    partner_id: '22222222-2222-2222-2222-222222222201',
    type: 'add',
    points: 1200,
    avl_points: 2450,
    notes: 'Loyalty bonus awarded for accepting wholesale bulk purchase bill_84920 and prompt delivery confirmation.',
    created_at: formatDateYMD(new Date()),
  },
  {
    id: 'pt-102',
    partner_id: '22222222-2222-2222-2222-222222222201',
    type: 'delete',
    points: 300,
    avl_points: 1250,
    notes: 'Redeemed points towards discount on warehouse shipping fee and logistics handling.',
    created_at: formatDateYMD(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'pt-103',
    partner_id: '22222222-2222-2222-2222-222222222201',
    type: 'add',
    points: 550,
    avl_points: 1550,
    notes: 'Reward credit for partner category tier advancement and sustained monthly purchase volume.',
    created_at: formatDateYMD(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'pt-104',
    partner_id: '22222222-2222-2222-2222-222222222201',
    type: 'add',
    points: 1000,
    avl_points: 1000,
    notes: 'Initial partner registration welcome rewards and onboarding credit balance.',
    created_at: formatDateYMD(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
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

const getLocalPointsTransactions = (): PartnerPointTransaction[] => {
  if (typeof window === 'undefined') return initialDemoTransactions;
  const saved = localStorage.getItem(LOCAL_POINTS_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_POINTS_KEY, JSON.stringify(initialDemoTransactions));
    return initialDemoTransactions;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return initialDemoTransactions;
  }
};

/**
 * Fetch available points and total points for current partner from public.partner_profile
 */
export async function getPartnerPointsSummary(): Promise<{
  data: PartnerPointsSummary | null;
  error: Error | null;
}> {
  const fallbackSummary: PartnerPointsSummary = {
    partner_id: 'partner_101',
    available_points: 2450,
    total_points: 2750,
  };

  if (typeof window !== 'undefined') {
    const sessionStr = localStorage.getItem('plyaqua_session_user');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.profile?.email) {
          const savedPartners = localStorage.getItem('plyaqua_partners_data');
          if (savedPartners) {
            const list = JSON.parse(savedPartners);
            const found = list.find(
              (p: { email: string }) => p.email?.toLowerCase() === parsed.profile.email.toLowerCase()
            );
            if (found) {
              fallbackSummary.partner_id = found.partner_id || found.id;
              fallbackSummary.available_points = Number(found.available_points) || 2450;
              fallbackSummary.total_points = Number(found.total_points) || 2750;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  if (isPlaceholderConfig()) {
    return { data: fallbackSummary, error: null };
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return { data: fallbackSummary, error: null };
    }

    const { data: profile, error } = await supabase
      .from('partner_profile')
      .select('id, partner_id, available_points, total_points')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile) {
      return { data: fallbackSummary, error: null };
    }

    return {
      data: {
        partner_id: profile.partner_id || profile.id,
        available_points: Number(profile.available_points) || 0,
        total_points: Number(profile.total_points) || 0,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      data: fallbackSummary,
      error: err instanceof Error ? err : new Error('Failed to load points summary'),
    };
  }
}

/**
 * Fetch partner points transactions from public.partner_points with optional date filtering
 */
export async function getPartnerPointTransactions(filters?: {
  fromDate?: string;
  toDate?: string;
}): Promise<{
  data: PartnerPointTransaction[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalPointsTransactions();

    if (filters?.fromDate) {
      list = list.filter((tx) => tx.created_at >= filters.fromDate!);
    }

    if (filters?.toDate) {
      list = list.filter((tx) => tx.created_at <= filters.toDate!);
    }

    return { data: list, error: null };
  }

  try {
    const user = await getCurrentUser();
    let query = supabase
      .from('partner_points')
      .select('*')
      .order('id', { ascending: false });

    if (user?.id) {
      query = query.eq('partner_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase partner_points query error, using local fallback:', error.message);
      let list = getLocalPointsTransactions();
      if (filters?.fromDate) {
        list = list.filter((tx) => tx.created_at >= filters.fromDate!);
      }
      if (filters?.toDate) {
        list = list.filter((tx) => tx.created_at <= filters.toDate!);
      }
      return { data: list, error: null };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    let formatted: PartnerPointTransaction[] = data.map((row) => ({
      id: row.id,
      partner_id: row.partner_id,
      type: (row.type as PointsTransType) || 'add',
      points: Number(row.points) || 0,
      avl_points: Number(row.avl_points) || 0,
      notes: row.notes || null,
      created_at: row.created_at ? row.created_at.split('T')[0] : formatDateYMD(new Date()),
    }));

    if (filters?.fromDate) {
      formatted = formatted.filter((tx) => tx.created_at >= filters.fromDate!);
    }

    if (filters?.toDate) {
      formatted = formatted.filter((tx) => tx.created_at <= filters.toDate!);
    }

    return { data: formatted, error: null };
  } catch (err: unknown) {
    let list = getLocalPointsTransactions();
    if (filters?.fromDate) {
      list = list.filter((tx) => tx.created_at >= filters.fromDate!);
    }
    if (filters?.toDate) {
      list = list.filter((tx) => tx.created_at <= filters.toDate!);
    }
    return {
      data: list,
      error: err instanceof Error ? err : new Error('Failed to load points transactions'),
    };
  }
}
