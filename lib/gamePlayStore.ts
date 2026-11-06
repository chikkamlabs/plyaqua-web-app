import { supabase } from './supabase';

export interface GameWord {
  id: string;
  name: string;
  status: 'active' | 'deactive' | string;
  created_at?: string;
  updated_at?: string;
}

export interface GamePoint {
  id: string;
  values: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface GameCashback {
  id: string;
  range_from: number;
  range_to: number;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_WORDS_KEY = 'plyaqua_game_words_data';
const LOCAL_POINTS_KEY = 'plyaqua_game_points_data';
const LOCAL_CASHBACK_KEY = 'plyaqua_game_cashback_data';

const initialDemoWords: GameWord[] = [
  { id: 'gw-1', name: 'HYDRATION', status: 'active' },
  { id: 'gw-2', name: 'SPRINGWATER', status: 'active' },
  { id: 'gw-3', name: 'PLYPURITY', status: 'active' },
  { id: 'gw-4', name: 'REFRESH', status: 'active' },
  { id: 'gw-5', name: 'ECOBOTTLE', status: 'deactive' },
];

const initialDemoPoints: GamePoint[] = [
  { id: 'gp-1', values: 10, name: 'Bronze Splash' },
  { id: 'gp-2', values: 25, name: 'Silver Wave' },
  { id: 'gp-3', values: 50, name: 'Gold Waterfall' },
  { id: 'gp-4', values: 100, name: 'Platinum Ocean' },
];

const initialDemoCashbacks: GameCashback[] = [
  { id: 'gc-1', range_from: 5.0, range_to: 15.0 },
  { id: 'gc-2', range_from: 20.0, range_to: 50.0 },
  { id: 'gc-3', range_from: 75.0, range_to: 150.0 },
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

// ---------------- LOCAL STORAGE HELPERS ----------------

function getLocal<T>(key: string, defaults: T[]): T[] {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return defaults;
  }
}

function setLocal<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

// ============================================================================
// GAME WORDS FUNCTIONS
// ============================================================================

export async function getGameWords(): Promise<{ data: GameWord[]; error: Error | null }> {
  if (isPlaceholderConfig()) {
    return { data: getLocal(LOCAL_WORDS_KEY, initialDemoWords), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('game_words')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('game_words query error, falling back to local storage:', error?.message);
      return { data: getLocal(LOCAL_WORDS_KEY, initialDemoWords), error: null };
    }

    setLocal(LOCAL_WORDS_KEY, data);
    return { data, error: null };
  } catch (err) {
    return {
      data: getLocal(LOCAL_WORDS_KEY, initialDemoWords),
      error: err instanceof Error ? err : new Error('Failed to fetch game words'),
    };
  }
}

export async function addGameWord(
  name: string,
  status: 'active' | 'deactive' = 'active'
): Promise<{ data: GameWord | null; error: Error | null }> {
  const trimmed = name.trim().toUpperCase();
  if (!trimmed) {
    return { data: null, error: new Error('Word name cannot be empty') };
  }

  const nowIso = new Date().toISOString();
  const newWord: GameWord = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gw-${Date.now()}`,
    name: trimmed,
    status,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const current = getLocal(LOCAL_WORDS_KEY, initialDemoWords);
  setLocal(LOCAL_WORDS_KEY, [newWord, ...current]);

  if (isPlaceholderConfig()) {
    return { data: newWord, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('game_words')
      .insert({
        name: trimmed,
        status,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('game_words insert error in Supabase:', error.message);
      return { data: newWord, error: null };
    }

    return { data: data || newWord, error: null };
  } catch (err) {
    return {
      data: newWord,
      error: err instanceof Error ? err : new Error('Failed to add word'),
    };
  }
}

export async function updateGameWord(
  id: string,
  updates: { name?: string; status?: 'active' | 'deactive' | string }
): Promise<{ data: GameWord | null; error: Error | null }> {
  const current = getLocal(LOCAL_WORDS_KEY, initialDemoWords);
  const idx = current.findIndex((w) => w.id === id);
  let updatedRecord: GameWord | null = null;

  if (idx !== -1) {
    current[idx] = {
      ...current[idx],
      ...updates,
      name: updates.name ? updates.name.trim().toUpperCase() : current[idx].name,
      updated_at: new Date().toISOString(),
    };
    updatedRecord = current[idx];
    setLocal(LOCAL_WORDS_KEY, current);
  }

  if (isPlaceholderConfig()) {
    return { data: updatedRecord, error: null };
  }

  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name.trim().toUpperCase();
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await supabase
      .from('game_words')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('game_words update error in Supabase:', error.message);
      return { data: updatedRecord, error: null };
    }

    return { data: data || updatedRecord, error: null };
  } catch (err) {
    return {
      data: updatedRecord,
      error: err instanceof Error ? err : new Error('Failed to update game word'),
    };
  }
}

export async function deleteGameWord(id: string): Promise<{ success: boolean; error: Error | null }> {
  const current = getLocal(LOCAL_WORDS_KEY, initialDemoWords);
  setLocal(LOCAL_WORDS_KEY, current.filter((w) => w.id !== id));

  if (isPlaceholderConfig()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('game_words').delete().eq('id', id);
    if (error) {
      console.warn('game_words delete error in Supabase:', error.message);
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete game word'),
    };
  }
}

// ============================================================================
// GAME POINTS FUNCTIONS
// ============================================================================

export async function getGamePoints(): Promise<{ data: GamePoint[]; error: Error | null }> {
  if (isPlaceholderConfig()) {
    return { data: getLocal(LOCAL_POINTS_KEY, initialDemoPoints), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('game_points')
      .select('*')
      .order('values', { ascending: true });

    if (error || !data) {
      console.warn('game_points query error, falling back to local:', error?.message);
      return { data: getLocal(LOCAL_POINTS_KEY, initialDemoPoints), error: null };
    }

    setLocal(LOCAL_POINTS_KEY, data);
    return { data, error: null };
  } catch (err) {
    return {
      data: getLocal(LOCAL_POINTS_KEY, initialDemoPoints),
      error: err instanceof Error ? err : new Error('Failed to fetch game points'),
    };
  }
}

export async function addGamePoint(
  values: number,
  name: string
): Promise<{ data: GamePoint | null; error: Error | null }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { data: null, error: new Error('Reward title/name is required') };
  }

  const nowIso = new Date().toISOString();
  const newPoint: GamePoint = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gp-${Date.now()}`,
    values: Number(values) || 0,
    name: trimmed,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const current = getLocal(LOCAL_POINTS_KEY, initialDemoPoints);
  setLocal(LOCAL_POINTS_KEY, [...current, newPoint]);

  if (isPlaceholderConfig()) {
    return { data: newPoint, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('game_points')
      .insert({
        values: Number(values) || 0,
        name: trimmed,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('game_points insert error in Supabase:', error.message);
      return { data: newPoint, error: null };
    }

    return { data: data || newPoint, error: null };
  } catch (err) {
    return {
      data: newPoint,
      error: err instanceof Error ? err : new Error('Failed to add game point'),
    };
  }
}

export async function updateGamePoint(
  id: string,
  updates: { values?: number; name?: string }
): Promise<{ data: GamePoint | null; error: Error | null }> {
  const current = getLocal(LOCAL_POINTS_KEY, initialDemoPoints);
  const idx = current.findIndex((p) => p.id === id);
  let updatedRecord: GamePoint | null = null;

  if (idx !== -1) {
    current[idx] = {
      ...current[idx],
      ...updates,
      values: updates.values !== undefined ? Number(updates.values) : current[idx].values,
      name: updates.name ? updates.name.trim() : current[idx].name,
      updated_at: new Date().toISOString(),
    };
    updatedRecord = current[idx];
    setLocal(LOCAL_POINTS_KEY, current);
  }

  if (isPlaceholderConfig()) {
    return { data: updatedRecord, error: null };
  }

  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.values !== undefined) payload.values = Number(updates.values);
    if (updates.name !== undefined) payload.name = updates.name.trim();

    const { data, error } = await supabase
      .from('game_points')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('game_points update error in Supabase:', error.message);
      return { data: updatedRecord, error: null };
    }

    return { data: data || updatedRecord, error: null };
  } catch (err) {
    return {
      data: updatedRecord,
      error: err instanceof Error ? err : new Error('Failed to update game point'),
    };
  }
}

export async function deleteGamePoint(id: string): Promise<{ success: boolean; error: Error | null }> {
  const current = getLocal(LOCAL_POINTS_KEY, initialDemoPoints);
  setLocal(LOCAL_POINTS_KEY, current.filter((p) => p.id !== id));

  if (isPlaceholderConfig()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('game_points').delete().eq('id', id);
    if (error) {
      console.warn('game_points delete error in Supabase:', error.message);
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete game point'),
    };
  }
}

// ============================================================================
// GAME CASHBACK FUNCTIONS
// ============================================================================

export async function getGameCashbacks(): Promise<{ data: GameCashback[]; error: Error | null }> {
  if (isPlaceholderConfig()) {
    return { data: getLocal(LOCAL_CASHBACK_KEY, initialDemoCashbacks), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('game_cashback')
      .select('*')
      .order('range_from', { ascending: true });

    if (error || !data) {
      console.warn('game_cashback query error, falling back to local:', error?.message);
      return { data: getLocal(LOCAL_CASHBACK_KEY, initialDemoCashbacks), error: null };
    }

    setLocal(LOCAL_CASHBACK_KEY, data);
    return { data, error: null };
  } catch (err) {
    return {
      data: getLocal(LOCAL_CASHBACK_KEY, initialDemoCashbacks),
      error: err instanceof Error ? err : new Error('Failed to fetch game cashbacks'),
    };
  }
}

export async function addGameCashback(
  range_from: number,
  range_to: number
): Promise<{ data: GameCashback | null; error: Error | null }> {
  const fromNum = Number(range_from);
  const toNum = Number(range_to);

  if (isNaN(fromNum) || isNaN(toNum)) {
    return { data: null, error: new Error('Please enter valid numeric values for cashback range') };
  }
  if (fromNum > toNum) {
    return { data: null, error: new Error('"Range From" cannot be greater than "Range To"') };
  }

  const nowIso = new Date().toISOString();
  const newCashback: GameCashback = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gc-${Date.now()}`,
    range_from: fromNum,
    range_to: toNum,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const current = getLocal(LOCAL_CASHBACK_KEY, initialDemoCashbacks);
  setLocal(LOCAL_CASHBACK_KEY, [...current, newCashback]);

  if (isPlaceholderConfig()) {
    return { data: newCashback, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('game_cashback')
      .insert({
        range_from: fromNum,
        range_to: toNum,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('game_cashback insert error in Supabase:', error.message);
      return { data: newCashback, error: null };
    }

    return { data: data || newCashback, error: null };
  } catch (err) {
    return {
      data: newCashback,
      error: err instanceof Error ? err : new Error('Failed to add game cashback range'),
    };
  }
}

export async function updateGameCashback(
  id: string,
  updates: { range_from?: number; range_to?: number }
): Promise<{ data: GameCashback | null; error: Error | null }> {
  const current = getLocal(LOCAL_CASHBACK_KEY, initialDemoCashbacks);
  const idx = current.findIndex((c) => c.id === id);
  let updatedRecord: GameCashback | null = null;

  if (idx !== -1) {
    const finalFrom = updates.range_from !== undefined ? Number(updates.range_from) : current[idx].range_from;
    const finalTo = updates.range_to !== undefined ? Number(updates.range_to) : current[idx].range_to;

    if (finalFrom > finalTo) {
      return { data: null, error: new Error('"Range From" cannot be greater than "Range To"') };
    }

    current[idx] = {
      ...current[idx],
      range_from: finalFrom,
      range_to: finalTo,
      updated_at: new Date().toISOString(),
    };
    updatedRecord = current[idx];
    setLocal(LOCAL_CASHBACK_KEY, current);
  }

  if (isPlaceholderConfig()) {
    return { data: updatedRecord, error: null };
  }

  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.range_from !== undefined) payload.range_from = Number(updates.range_from);
    if (updates.range_to !== undefined) payload.range_to = Number(updates.range_to);

    const { data, error } = await supabase
      .from('game_cashback')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('game_cashback update error in Supabase:', error.message);
      return { data: updatedRecord, error: null };
    }

    return { data: data || updatedRecord, error: null };
  } catch (err) {
    return {
      data: updatedRecord,
      error: err instanceof Error ? err : new Error('Failed to update game cashback range'),
    };
  }
}

export async function deleteGameCashback(id: string): Promise<{ success: boolean; error: Error | null }> {
  const current = getLocal(LOCAL_CASHBACK_KEY, initialDemoCashbacks);
  setLocal(LOCAL_CASHBACK_KEY, current.filter((c) => c.id !== id));

  if (isPlaceholderConfig()) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('game_cashback').delete().eq('id', id);
    if (error) {
      console.warn('game_cashback delete error in Supabase:', error.message);
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete game cashback range'),
    };
  }
}
