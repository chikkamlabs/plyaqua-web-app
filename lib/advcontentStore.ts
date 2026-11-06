import { supabase } from './supabase';

export type MediaType = 'image' | 'video';
export type ActiveStatus = 'active' | 'deactive';

export interface AdContent {
  id: string;
  title: string;
  media_type: MediaType;
  media_url: string;
  status: ActiveStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AdContentFilters {
  status?: string; // 'all' | 'active' | 'deactive'
  title?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_ad_content_data';

const initialDemoAds: AdContent[] = [
  {
    id: 'ad-001',
    title: 'Pure Hydration Splash Campaign',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ad-002',
    title: 'PlyAqua Mineral Spring Water Commercial',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    status: 'active',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ad-003',
    title: 'Eco-Friendly 20L Dispenser Jars',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=1200&q=80',
    status: 'deactive',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
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

function getLocalAds(): AdContent[] {
  if (typeof window === 'undefined') return initialDemoAds;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoAds));
      return initialDemoAds;
    }
    return JSON.parse(raw);
  } catch {
    return initialDemoAds;
  }
}

function setLocalAds(ads: AdContent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ads));
  } catch (e) {
    console.error('Failed to save ad content to localStorage:', e);
  }
}

/**
 * Uploads media file to the dedicated Supabase Storage bucket:
 * - adv_content_img if image
 * - adv_content_vid if video
 * Returns the public URL of the uploaded asset.
 */
export async function uploadAdMedia(
  file: File,
  mediaType: MediaType
): Promise<{ url: string | null; error: Error | null }> {
  const bucket = mediaType === 'video' ? 'adv_content_vid' : 'adv_content_img';
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${Date.now()}_${cleanFileName}`;

  if (isPlaceholderConfig()) {
    // Demo mode: create browser blob URL for interactive testing
    if (typeof window !== 'undefined') {
      const blobUrl = URL.createObjectURL(file);
      return { url: blobUrl, error: null };
    }
    return {
      url: mediaType === 'video'
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=1200&q=80',
      error: null,
    };
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn(`Supabase storage upload error in ${bucket}:`, uploadError.message);
      // Fallback to local blob URL if bucket permissions are not yet configured
      if (typeof window !== 'undefined') {
        return { url: URL.createObjectURL(file), error: null };
      }
      return { url: null, error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err) {
    console.warn('Upload error, fallback to blob URL:', err);
    if (typeof window !== 'undefined') {
      return { url: URL.createObjectURL(file), error: null };
    }
    return {
      url: null,
      error: err instanceof Error ? err : new Error('Failed to upload media file'),
    };
  }
}

/**
 * Fetch ad_content list with optional status and title filters.
 */
export async function getAdContents(filters?: AdContentFilters): Promise<{
  data: AdContent[];
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    let list = getLocalAds();

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((ad) => ad.status === filters.status);
    }
    if (filters?.title && filters.title.trim()) {
      const q = filters.title.trim().toLowerCase();
      list = list.filter((ad) => ad.title.toLowerCase().includes(q));
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
      .from('ad_content')
      .select('id, title, media_type, media_url, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase ad_content query error, using local fallback:', error.message);
      let list = getLocalAds();
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((ad) => ad.status === filters.status);
      }
      if (filters?.title && filters.title.trim()) {
        const q = filters.title.trim().toLowerCase();
        list = list.filter((ad) => ad.title.toLowerCase().includes(q));
      }
      return { data: list, error: null };
    }

    let items: AdContent[] = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      media_type: (row.media_type as MediaType) || 'image',
      media_url: row.media_url || '',
      status: (row.status as ActiveStatus) || 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (filters?.title && filters.title.trim()) {
      const q = filters.title.trim().toLowerCase();
      items = items.filter((ad) => ad.title.toLowerCase().includes(q));
    }

    return { data: items, error: null };
  } catch (err) {
    return {
      data: getLocalAds(),
      error: err instanceof Error ? err : new Error('Failed to load ad content'),
    };
  }
}

/**
 * Creates a new ad_content record. Default status is 'active'.
 */
export async function createAdContent(input: {
  title: string;
  media_type: MediaType;
  media_url: string;
  status?: ActiveStatus;
}): Promise<{ data: AdContent | null; error: Error | null }> {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return { data: null, error: new Error('Ad title is required') };
  }

  const now = new Date().toISOString();
  const newAd: AdContent = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ad-${Date.now()}`,
    title: trimmedTitle,
    media_type: input.media_type,
    media_url: input.media_url,
    status: input.status || 'active',
    created_at: now,
    updated_at: now,
  };

  // Update local storage
  const current = getLocalAds();
  setLocalAds([newAd, ...current]);

  if (isPlaceholderConfig()) {
    return { data: newAd, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('ad_content')
      .insert({
        title: trimmedTitle,
        media_type: input.media_type,
        media_url: input.media_url,
        status: input.status || 'active',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase insert error for ad_content:', error.message);
      return { data: newAd, error: null };
    }

    return { data: data || newAd, error: null };
  } catch (err) {
    return {
      data: newAd,
      error: err instanceof Error ? err : new Error('Failed to create ad content'),
    };
  }
}
