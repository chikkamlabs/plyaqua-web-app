import { supabase } from './supabase';
import { getAdContents, AdContent } from './advcontentStore';

export type CampaignStatus = 'active' | 'deactive';

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  content_id: string | null;
  content_title?: string;
  content_media_type?: string;
  content_media_url?: string;
  views: number;
  status: CampaignStatus;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_mtrs: number | null;
  location_enabled: boolean;
  start_date: string | null;
  end_date: string | null;
  max_views: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignFilters {
  status?: string; // 'all' | 'active' | 'deactive'
  search?: string; // Searches both campaign title & content title
}

const LOCAL_STORAGE_KEY = 'plyaqua_campaigns_data';

const initialDemoCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    title: 'Metro Hydration Monsoon Drive',
    description: 'Promotional discount campaign targeting commuters across city center hubs.',
    content_id: 'ad-001',
    content_title: 'Pure Hydration Splash Campaign',
    content_media_type: 'image',
    content_media_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=1200&q=80',
    views: 420,
    status: 'active',
    location_name: 'Secunderabad & Hyderabad Central',
    latitude: 17.385,
    longitude: 78.4867,
    radius_mtrs: 5000,
    location_enabled: true,
    start_date: '2026-11-01',
    end_date: '2026-11-30',
    max_views: 5000,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'camp-002',
    title: 'Commercial Mineral Water Video Showcase',
    description: 'Showcasing PlyAqua natural spring purification video at corporate partner cafeterias.',
    content_id: 'ad-002',
    content_title: 'PlyAqua Mineral Spring Water Commercial',
    content_media_type: 'video',
    content_media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    views: 890,
    status: 'deactive',
    location_name: 'Bengaluru Tech Corridor',
    latitude: 12.9716,
    longitude: 77.5946,
    radius_mtrs: 10000,
    location_enabled: false,
    start_date: '2026-10-15',
    end_date: '2026-10-31',
    max_views: 2000,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
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

function getLocalCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return initialDemoCampaigns;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoCampaigns));
      return initialDemoCampaigns;
    }
    return JSON.parse(raw);
  } catch {
    return initialDemoCampaigns;
  }
}

function setLocalCampaigns(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error('Failed to save campaigns to localStorage:', e);
  }
}

/**
 * Fetch active ad_contents from ad_content table for campaign selection
 */
export async function getActiveAdContents(): Promise<{ data: AdContent[]; error: Error | null }> {
  const res = await getAdContents({ status: 'active' });
  return { data: res.data || [], error: res.error };
}

/**
 * Fetch campaigns with content details, applying status filter and search query (title or content title).
 */
export async function getCampaigns(filters?: CampaignFilters): Promise<{
  data: Campaign[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalCampaigns();

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.content_title || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return { data: list, error: null };
  }

  try {
    let query = supabase
      .from('campaigns')
      .select(`
        id,
        title,
        description,
        content_id,
        views,
        status,
        location_name,
        latitude,
        longitude,
        radius_mtrs,
        location_enabled,
        start_date,
        end_date,
        max_views,
        created_at,
        updated_at,
        content:ad_content (
          id,
          title,
          media_type,
          media_url
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase campaigns query error, falling back to local demo:', error.message);
      let list = getLocalCampaigns();
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((c) => c.status === filters.status);
      }
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            (c.content_title || '').toLowerCase().includes(q)
        );
      }
      return { data: list, error: null };
    }

    let items: Campaign[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || null,
      content_id: row.content_id,
      content_title: row.content?.title || 'No attached media',
      content_media_type: row.content?.media_type || 'image',
      content_media_url: row.content?.media_url || '',
      views: Number(row.views) || 0,
      status: (row.status as CampaignStatus) || 'deactive',
      location_name: row.location_name || null,
      latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
      longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
      radius_mtrs: row.radius_mtrs !== null && row.radius_mtrs !== undefined ? Number(row.radius_mtrs) : null,
      location_enabled: Boolean(row.location_enabled),
      start_date: row.start_date ? row.start_date.slice(0, 10) : null,
      end_date: row.end_date ? row.end_date.slice(0, 10) : null,
      max_views: row.max_views !== null && row.max_views !== undefined ? Number(row.max_views) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    // Client-side search for title or content title
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.content_title || '').toLowerCase().includes(q)
      );
    }

    return { data: items, error: null };
  } catch (err) {
    return {
      data: getLocalCampaigns(),
      error: err instanceof Error ? err : new Error('Failed to load campaigns'),
    };
  }
}

/**
 * Creates and launches a new campaign in the database.
 */
export async function createCampaign(input: {
  title: string;
  description: string | null;
  content_id: string | null;
  content_title?: string;
  content_media_type?: string;
  content_media_url?: string;
  start_date: string | null;
  end_date: string | null;
  max_views: number | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_mtrs: number | null;
  location_enabled: boolean;
  status: CampaignStatus;
}): Promise<{ data: Campaign | null; error: Error | null }> {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return { data: null, error: new Error('Campaign title is required.') };
  }

  const now = new Date().toISOString();
  const newCamp: Campaign = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `camp-₹{Date.now()}`,
    title: trimmedTitle,
    description: input.description,
    content_id: input.content_id,
    content_title: input.content_title || 'Attached Content',
    content_media_type: input.content_media_type || 'image',
    content_media_url: input.content_media_url || '',
    views: 0,
    status: input.status,
    location_name: input.location_name || null,
    latitude: input.latitude,
    longitude: input.longitude,
    radius_mtrs: input.radius_mtrs,
    location_enabled: input.location_enabled,
    start_date: input.start_date,
    end_date: input.end_date,
    max_views: input.max_views,
    created_at: now,
    updated_at: now,
  };

  // Local storage cache
  const current = getLocalCampaigns();
  setLocalCampaigns([newCamp, ...current]);

  if (isPlaceholderConfig()) {
    return { data: newCamp, error: null };
  }

  try {
    const payload = {
      title: trimmedTitle,
      description: input.description,
      content_id: input.content_id || null,
      views: 0,
      status: input.status,
      location_name: input.location_name || null,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_mtrs: input.radius_mtrs,
      location_enabled: input.location_enabled,
      start_date: input.start_date ? `₹{input.start_date}T00:00:00.000Z` : null,
      end_date: input.end_date ? `₹{input.end_date}T23:59:59.999Z` : null,
      max_views: input.max_views,
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase insert error for campaigns:', error.message);
      return { data: newCamp, error: null };
    }

    return {
      data: {
        ...newCamp,
        id: data?.id || newCamp.id,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: newCamp,
      error: err instanceof Error ? err : new Error('Failed to create campaign'),
    };
  }
}

/**
 * Updates an existing campaign in public.campaigns table and local storage.
 */
export async function updateCampaign(
  id: string,
  updates: {
    title: string;
    description: string | null;
    content_id: string | null;
    content_title?: string;
    content_media_type?: string;
    content_media_url?: string;
    start_date: string | null;
    end_date: string | null;
    max_views: number | null;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
    radius_mtrs: number | null;
    location_enabled: boolean;
    status: CampaignStatus;
  }
): Promise<{ data: Campaign | null; error: Error | null }> {
  const trimmedTitle = updates.title.trim();
  if (!trimmedTitle) {
    return { data: null, error: new Error('Campaign title is required.') };
  }

  const now = new Date().toISOString();
  const currentList = getLocalCampaigns();
  const idx = currentList.findIndex((c) => c.id === id);

  let updatedRecord: Campaign = {
    ...(idx !== -1 ? currentList[idx] : ({} as Campaign)),
    id,
    title: trimmedTitle,
    description: updates.description,
    content_id: updates.content_id,
    content_title: updates.content_title || (idx !== -1 ? currentList[idx].content_title : ''),
    content_media_type: updates.content_media_type || (idx !== -1 ? currentList[idx].content_media_type : 'image'),
    content_media_url: updates.content_media_url || (idx !== -1 ? currentList[idx].content_media_url : ''),
    views: idx !== -1 ? currentList[idx].views : 0,
    status: updates.status,
    location_name: updates.location_name || null,
    latitude: updates.latitude,
    longitude: updates.longitude,
    radius_mtrs: updates.radius_mtrs,
    location_enabled: updates.location_enabled,
    start_date: updates.start_date,
    end_date: updates.end_date,
    max_views: updates.max_views,
    updated_at: now,
  };

  if (idx !== -1) {
    currentList[idx] = updatedRecord;
    setLocalCampaigns(currentList);
  }

  if (isPlaceholderConfig()) {
    return { data: updatedRecord, error: null };
  }

  try {
    const payload = {
      title: trimmedTitle,
      description: updates.description,
      content_id: updates.content_id || null,
      status: updates.status,
      location_name: updates.location_name || null,
      latitude: updates.latitude,
      longitude: updates.longitude,
      radius_mtrs: updates.radius_mtrs,
      location_enabled: updates.location_enabled,
      start_date: updates.start_date ? `₹{updates.start_date}T00:00:00.000Z` : null,
      end_date: updates.end_date ? `₹{updates.end_date}T23:59:59.999Z` : null,
      max_views: updates.max_views,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('campaigns')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase update error for campaigns:', error.message);
      return { data: updatedRecord, error: null };
    }

    return {
      data: {
        ...updatedRecord,
        ...(data || {}),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: updatedRecord,
      error: err instanceof Error ? err : new Error('Failed to update campaign'),
    };
  }
}
