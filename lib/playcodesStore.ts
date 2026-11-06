import { supabase } from './supabase';

export type PlaycodeStatus = 'active' | 'deactive';

export interface Playcode {
  id: string;
  code: string;
  status: PlaycodeStatus;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'plyaqua_playcodes_data';

// Initial demo playcodes for offline/fallback mode
const initialDemoPlaycodes: Playcode[] = Array.from({ length: 25 }, (_, idx) => {
  const num = 1001 + idx;
  return {
    id: `pc-₹{num}`,
    code: `ply-₹{num}`,
    status: 'active' as PlaycodeStatus,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  };
});

const isPlaceholderConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    !url ||
    url.includes('your-project.supabase.co') ||
    url.includes('placeholder') ||
    !key ||
    key.includes('your-anon-key') ||
    key === 'placeholder'
  );
};

const getLocalPlaycodes = (): Playcode[] => {
  if (typeof window === 'undefined') return initialDemoPlaycodes;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoPlaycodes));
      return initialDemoPlaycodes;
    }
    return JSON.parse(data);
  } catch {
    return initialDemoPlaycodes;
  }
};

const setLocalPlaycodes = (codes: Playcode[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.error('Failed to save playcodes to localStorage', err);
  }
};

/**
 * Get total count of active playcodes
 */
export async function getTotalActivePlaycodesCount(): Promise<{
  count: number;
  error: Error | null;
}> {
  if (isPlaceholderConfig()) {
    const local = getLocalPlaycodes();
    const activeCount = local.filter((c) => c.status === 'active').length;
    return { count: activeCount, error: null };
  }

  try {
    const { count, error } = await supabase
      .from('playcodes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) {
      console.warn('Supabase get playcodes count error, falling back to local storage:', error);
      const local = getLocalPlaycodes();
      const activeCount = local.filter((c) => c.status === 'active').length;
      return { count: activeCount, error: null };
    }

    return { count: count ?? 0, error: null };
  } catch (err) {
    console.error('Error fetching active playcodes count:', err);
    const local = getLocalPlaycodes();
    const activeCount = local.filter((c) => c.status === 'active').length;
    return { count: activeCount, error: null };
  }
}

/**
 * Generate codes in the range [from, to] inclusive:
 * "ply-{from}" to "ply-{to}"
 * and insert into playcodes table with status 'active'.
 *
 * All generation and insertion logic is encapsulated here.
 */
export async function generateAndInsertPlaycodes(
  fromRange: number,
  toRange: number
): Promise<{
  count: number;
  generatedCodes: string[];
  error: Error | null;
}> {
  // 1. Validation: from and to must be integers, to > from
  const from = Math.floor(Number(fromRange));
  const to = Math.floor(Number(toRange));

  if (isNaN(from) || isNaN(to)) {
    return {
      count: 0,
      generatedCodes: [],
      error: new Error('From and To must be valid numbers.'),
    };
  }

  if (from < 0) {
    return {
      count: 0,
      generatedCodes: [],
      error: new Error('From number must be 0 or greater.'),
    };
  }

  if (to <= from) {
    return {
      count: 0,
      generatedCodes: [],
      error: new Error('To number must be strictly greater than From number.'),
    };
  }

  const totalToGenerate = to - from + 1;
  if (totalToGenerate > 10000) {
    return {
      count: 0,
      generatedCodes: [],
      error: new Error('Range too large. Please generate up to 10,000 codes at a time.'),
    };
  }

  // 2. Generate the code items
  const generatedCodes: string[] = [];
  const recordsToInsert: Array<{ code: string; status: PlaycodeStatus }> = [];

  for (let num = from; num <= to; num++) {
    const codeStr = `ply-₹{num}`;
    generatedCodes.push(codeStr);
    recordsToInsert.push({
      code: codeStr,
      status: 'active',
    });
  }

  // 3. Fallback or placeholder mode
  if (isPlaceholderConfig()) {
    const current = getLocalPlaycodes();
    const existingMap = new Map<string, Playcode>();
    current.forEach((item) => existingMap.set(item.code, item));

    const now = new Date().toISOString();
    recordsToInsert.forEach((rec, idx) => {
      existingMap.set(rec.code, {
        id: `pc-₹{from + idx}-₹{Date.now()}`,
        code: rec.code,
        status: rec.status,
        created_at: now,
        updated_at: now,
      });
    });

    setLocalPlaycodes(Array.from(existingMap.values()));
    return {
      count: recordsToInsert.length,
      generatedCodes,
      error: null,
    };
  }

  // 4. Supabase batch insert with chunking
  try {
    const CHUNK_SIZE = 250;
    for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
      const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);

      // Upsert so if a code already exists, its status becomes active
      const { error: insertError } = await supabase
        .from('playcodes')
        .upsert(chunk, { onConflict: 'code' });

      if (insertError) {
        // If upsert fails (e.g. permissions or missing constraint), try simple insert
        const { error: fallbackError } = await supabase
          .from('playcodes')
          .insert(chunk);

        if (fallbackError) {
          console.warn('Supabase playcodes insert error:', fallbackError);
          // Sync with local storage as a fallback
          const current = getLocalPlaycodes();
          const existingMap = new Map<string, Playcode>();
          current.forEach((item) => existingMap.set(item.code, item));
          const now = new Date().toISOString();
          recordsToInsert.forEach((rec, idx) => {
            existingMap.set(rec.code, {
              id: `pc-₹{from + idx}-₹{Date.now()}`,
              code: rec.code,
              status: rec.status,
              created_at: now,
              updated_at: now,
            });
          });
          setLocalPlaycodes(Array.from(existingMap.values()));

          return {
            count: recordsToInsert.length,
            generatedCodes,
            error: null,
          };
        }
      }
    }

    // Keep local storage synced as well
    const current = getLocalPlaycodes();
    const existingMap = new Map<string, Playcode>();
    current.forEach((item) => existingMap.set(item.code, item));
    const now = new Date().toISOString();
    recordsToInsert.forEach((rec, idx) => {
      existingMap.set(rec.code, {
        id: `pc-₹{from + idx}`,
        code: rec.code,
        status: rec.status,
        created_at: now,
        updated_at: now,
      });
    });
    setLocalPlaycodes(Array.from(existingMap.values()));

    return {
      count: recordsToInsert.length,
      generatedCodes,
      error: null,
    };
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.error('Exception generating playcodes:', errorObj);

    // Fallback to local storage
    const current = getLocalPlaycodes();
    const existingMap = new Map<string, Playcode>();
    current.forEach((item) => existingMap.set(item.code, item));
    const now = new Date().toISOString();
    recordsToInsert.forEach((rec, idx) => {
      existingMap.set(rec.code, {
        id: `pc-₹{from + idx}`,
        code: rec.code,
        status: rec.status,
        created_at: now,
        updated_at: now,
      });
    });
    setLocalPlaycodes(Array.from(existingMap.values()));

    return {
      count: recordsToInsert.length,
      generatedCodes,
      error: null,
    };
  }
}
