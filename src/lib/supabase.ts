import { createClient } from '@supabase/supabase-js';
import { ChatSession } from '../types/chat';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback initialization to prevent runtime crash if env vars are missing
export const supabase = createClient(
  supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://xyzcompany.supabase.co',
  supabaseAnonKey || 'public-anon-key'
);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('xyzcompany')
  );
};

// Auto-detect table name between 'chat_sessions' and 'chat_history'
let activeTableName: string | null = null;

async function detectActiveTableName(): Promise<string> {
  if (activeTableName) return activeTableName;

  try {
    const { error: errSessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .limit(1);

    if (!errSessions || errSessions.code !== 'PGRST301') {
      activeTableName = 'chat_sessions';
      return activeTableName;
    }

    const { error: errHistory } = await supabase
      .from('chat_history')
      .select('id')
      .limit(1);

    if (!errHistory) {
      activeTableName = 'chat_history';
      return activeTableName;
    }
  } catch (err) {
    console.warn('Table detection warning:', err);
  }

  activeTableName = 'chat_sessions';
  return activeTableName;
}

// Fetch user sessions mapped to authenticated user's ID
export async function fetchUserSessionsFromSupabase(userId: string): Promise<ChatSession[] | null> {
  if (!isSupabaseConfigured()) {
    console.info('Supabase is not configured yet. Using local state.');
    return null;
  }

  try {
    const tableName = await detectActiveTableName();
    console.log(`📡 Fetching sessions from Supabase table: '${tableName}' for user:`, userId);

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(`⚠️ Supabase fetch query error on table '${tableName}':`, error.message, error.details || '');
      // Try fallback table if primary table failed
      if (tableName === 'chat_sessions') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!fallbackError && fallbackData) {
          activeTableName = 'chat_history';
          return parseSupabaseRows(fallbackData);
        }
      }
      return null;
    }

    if (!data) return [];
    return parseSupabaseRows(data);
  } catch (err) {
    console.warn('Supabase fetch user sessions failed:', err);
    return null;
  }
}

function parseSupabaseRows(rows: any[]): ChatSession[] {
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title || 'New Conversation',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    messages: row.messages || row.chat_history || row.history || [],
  }));
}

// Upsert a user session into Supabase
export async function saveUserSessionToSupabase(userId: string, session: ChatSession): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const tableName = await detectActiveTableName();
    const payload = {
      id: session.id,
      user_id: userId,
      title: session.title,
      created_at: session.createdAt,
      messages: session.messages,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn(`⚠️ Supabase save session error on table '${tableName}':`, error.message);
      // Try fallback table if primary failed
      if (tableName === 'chat_sessions') {
        const { error: fbErr } = await supabase
          .from('chat_history')
          .upsert(payload, { onConflict: 'id' });

        if (!fbErr) {
          activeTableName = 'chat_history';
          return true;
        }
      }
      return false;
    }

    console.log(`✅ Session successfully saved to Supabase table '${tableName}':`, session.id);
    return true;
  } catch (err) {
    console.warn('Supabase save session failed:', err);
    return false;
  }
}

// Delete a session from Supabase
export async function deleteUserSessionFromSupabase(userId: string, sessionId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const tableName = await detectActiveTableName();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.warn(`⚠️ Supabase delete session error on table '${tableName}':`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete session failed:', err);
    return false;
  }
}

// Clear all sessions for a user
export async function clearAllUserSessionsFromSupabase(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const tableName = await detectActiveTableName();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn(`⚠️ Supabase clear sessions error on table '${tableName}':`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase clear sessions failed:', err);
    return false;
  }
}
