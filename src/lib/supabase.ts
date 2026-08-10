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

// Supabase Database queries mapped to authenticated user's ID
export async function fetchUserSessionsFromSupabase(userId: string): Promise<ChatSession[] | null> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch sessions query warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title || 'New Conversation',
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      messages: row.messages || [],
    }));
  } catch (err) {
    console.warn('Supabase fetch sessions failed:', err);
    return null;
  }
}

export async function saveUserSessionToSupabase(userId: string, session: ChatSession): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .upsert(
        {
          id: session.id,
          user_id: userId,
          title: session.title,
          created_at: session.createdAt,
          messages: session.messages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.warn('Supabase save session query warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save session failed:', err);
    return false;
  }
}

export async function deleteUserSessionFromSupabase(userId: string, sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase delete session query warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete session failed:', err);
    return false;
  }
}

export async function clearAllUserSessionsFromSupabase(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase clear sessions query warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase clear sessions failed:', err);
    return false;
  }
}
