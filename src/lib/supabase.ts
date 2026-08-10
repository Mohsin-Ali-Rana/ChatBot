import { createClient } from '@supabase/supabase-js';
import { ChatMessage, ChatSession } from '../types/chat';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback client initialization
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

// Target Table Name specified by schema: 'chat_history'
const TABLE_NAME = 'chat_history';

// Helper to validate UUID strings
const isValidUuid = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Fetch user history from 'chat_history' and map to ChatSession state
export async function fetchUserSessionsFromSupabase(userId: string): Promise<ChatSession[] | null> {
  if (!isSupabaseConfigured()) {
    console.info('ℹ️ Supabase credentials not set in env. Using local storage.');
    return null;
  }

  try {
    console.log(`📡 Fetching message history from '${TABLE_NAME}' for user:`, userId);

    // Query 'chat_history' ordered by creation time
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`❌ Error fetching from '${TABLE_NAME}':`, error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`ℹ️ No rows found in '${TABLE_NAME}' for user:`, userId);
      return [];
    }

    console.log(`✅ Loaded ${data.length} message row(s) from '${TABLE_NAME}'`);

    // Map each database row to ChatMessage matching columns: id, user_id, message, sender
    const messages: ChatMessage[] = data.map((row: any) => ({
      id: String(row.id),
      sender: (row.sender === 'user' || row.sender === 'human') ? 'user' : 'bot',
      text: row.message || row.text || '',
      timestamp: row.created_at
        ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }));

    // Group message history into an active session
    const firstUserMessage = messages.find((m) => m.sender === 'user');
    const sessionTitle = firstUserMessage 
      ? (firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')) 
      : 'Chat History';

    const session: ChatSession = {
      id: `session_${userId.slice(0, 8)}`,
      title: sessionTitle,
      createdAt: data[0]?.created_at || new Date().toISOString(),
      messages,
    };

    return [session];
  } catch (err) {
    console.error(`❌ Exception fetching '${TABLE_NAME}':`, err);
    return null;
  }
}

// Insert single message row into 'chat_history'
export async function saveChatMessageToSupabase(userId: string, message: ChatMessage): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const payload: any = {
      user_id: userId,
      message: message.text,
      sender: message.sender,
    };

    // Include valid UUID id if present, or generate UUID
    if (isValidUuid(message.id)) {
      payload.id = message.id;
    } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      payload.id = crypto.randomUUID();
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert(payload);

    if (error) {
      console.error(`❌ Error inserting message row into '${TABLE_NAME}':`, error.message);
      return false;
    }

    console.log(`✅ Inserted message into '${TABLE_NAME}':`, payload.message.slice(0, 20) + '...');
    return true;
  } catch (err) {
    console.error(`❌ Exception inserting message into '${TABLE_NAME}':`, err);
    return false;
  }
}

// Save all unsaved session messages to 'chat_history'
export async function saveUserSessionToSupabase(userId: string, session: ChatSession): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    if (!session.messages || session.messages.length === 0) return true;

    // Map each message to row matching: id (uuid), user_id (uuid), message (text), sender (text)
    const rowsToInsert = session.messages.map((msg) => {
      const row: any = {
        user_id: userId,
        message: msg.text,
        sender: msg.sender,
      };

      if (isValidUuid(msg.id)) {
        row.id = msg.id;
      } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        row.id = crypto.randomUUID();
      }

      return row;
    });

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(rowsToInsert, { onConflict: 'id' });

    if (error) {
      console.warn(`⚠️ Upsert error on '${TABLE_NAME}': ${error.message}. Retrying individual inserts...`);

      for (const row of rowsToInsert) {
        const { error: insErr } = await supabase
          .from(TABLE_NAME)
          .insert(row);

        if (insErr && !insErr.message.includes('duplicate key')) {
          console.error(`❌ Message row insert error:`, insErr.message);
        }
      }
    }

    console.log(`✅ Synchronized ${rowsToInsert.length} message row(s) to '${TABLE_NAME}'`);
    return true;
  } catch (err) {
    console.error(`❌ Exception saving session to '${TABLE_NAME}':`, err);
    return false;
  }
}

// Delete history for a user from 'chat_history'
export async function deleteUserSessionFromSupabase(userId: string, _sessionId: string): Promise<boolean> {
  return clearAllUserSessionsFromSupabase(userId);
}

// Clear all history rows for a user from 'chat_history'
export async function clearAllUserSessionsFromSupabase(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error(`❌ Error clearing rows from '${TABLE_NAME}':`, error.message);
      return false;
    }
    console.log(`🗑️ Cleared history rows from '${TABLE_NAME}' for user:`, userId);
    return true;
  } catch (err) {
    console.error(`❌ Exception clearing '${TABLE_NAME}':`, err);
    return false;
  }
}
