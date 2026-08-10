import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import {
  ChatHeader,
  Sidebar,
  ChatMessageComponent,
  ChatInput,
  TypingIndicator,
  WelcomeState,
  AuthModal,
  Toast,
} from './components';

import { ChatMessage, ChatSession, UserProfile, ToastAlert } from './types/chat';
import { 
  supabase, 
  fetchUserSessionsFromSupabase, 
  saveUserSessionToSupabase, 
  saveChatMessageToSupabase,
  deleteUserSessionFromSupabase 
} from './lib/supabase';

// Helper local storage keys per user context
const getGuestStorageKey = () => 'nexus_guest_sessions';
const getUserStorageKey = (userId: string) => `nexus_chat_sessions_${userId}`;
const getUserActiveKey = (userId: string) => `nexus_current_session_${userId}`;

export const App: React.FC = () => {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastAlert | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Authenticate User & Load History from Supabase 'chat_history'
  useEffect(() => {
    window.scrollTo(0, 0);

    const checkSupabaseAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          const sbUser = session.user;
          const userName = sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User';
          const userAvatar = sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;
          
          const profile: UserProfile = {
            id: sbUser.id,
            name: userName,
            email: sbUser.email || '',
            avatarUrl: userAvatar,
            isPro: true,
          };
          
          setUser(profile);
          await loadUserSessions(sbUser.id);
        } else {
          handleGuestInit();
        }
      } catch (err) {
        console.warn('Supabase auth check error:', err);
        handleGuestInit();
      }
    };

    checkSupabaseAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const sbUser = session.user;
        const userName = sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User';
        const userAvatar = sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;
        
        const profile: UserProfile = {
          id: sbUser.id,
          name: userName,
          email: sbUser.email || '',
          avatarUrl: userAvatar,
          isPro: true,
        };
        
        setUser(profile);
        await loadUserSessions(sbUser.id);
      } else if (event === 'SIGNED_OUT') {
        handleGuestInit();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Robust session loader: Syncs remote database data with isolated local cache
  const loadUserSessions = async (userId: string) => {
    const userStorageKey = getUserStorageKey(userId);
    const userActiveKey = getUserActiveKey(userId);

    // 1. Query Supabase 'chat_history' remote database first
    const remoteSessions = await fetchUserSessionsFromSupabase(userId);
    let loadedSessions: ChatSession[] = [];

    if (remoteSessions && remoteSessions.length > 0) {
      console.log('✅ Synchronized remote sessions from chat_history:', remoteSessions.length);
      loadedSessions = remoteSessions;
      localStorage.setItem(userStorageKey, JSON.stringify(remoteSessions));
    } else {
      // 2. Fallback to user-isolated local cache if remote returned empty/offline
      const cachedStr = localStorage.getItem(userStorageKey);
      if (cachedStr) {
        try {
          loadedSessions = JSON.parse(cachedStr);
          console.log('ℹ️ Loaded sessions from user local cache:', loadedSessions.length);
        } catch (e) {
          console.error('Failed to parse cached user sessions:', e);
        }
      }
    }

    let activeId = localStorage.getItem(userActiveKey) || '';

    // 3. If zero sessions found anywhere, create initial clean conversation
    if (loadedSessions.length === 0) {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `session_${Date.now()}`;
      loadedSessions = [{
        id: newId,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [],
      }];
      activeId = newId;
    } else if (!activeId || !loadedSessions.some((s) => s.id === activeId)) {
      activeId = loadedSessions[0].id;
    }

    setSessions(loadedSessions);
    setCurrentSessionId(activeId);
    localStorage.setItem(userActiveKey, activeId);
  };

  const handleGuestInit = () => {
    const guestKey = getGuestStorageKey();
    const cachedGuest = localStorage.getItem(guestKey);
    let guestSessions: ChatSession[] = [];

    if (cachedGuest) {
      try {
        guestSessions = JSON.parse(cachedGuest);
      } catch (e) {
        console.error('Failed to parse guest sessions:', e);
      }
    }

    if (guestSessions.length === 0) {
      const guestId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `session_${Date.now()}`;
      guestSessions = [{
        id: guestId,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [],
      }];
    }

    setUser(null);
    setSessions(guestSessions);
    setCurrentSessionId(guestSessions[0].id);
  };

  // Sync sessions to user-isolated LocalStorage & Supabase DB on updates
  useEffect(() => {
    if (user) {
      if (sessions.length > 0) {
        const userStorageKey = getUserStorageKey(user.id);
        const userActiveKey = getUserActiveKey(user.id);

        localStorage.setItem(userStorageKey, JSON.stringify(sessions));
        if (currentSessionId) {
          localStorage.setItem(userActiveKey, currentSessionId);
        }

        const activeSession = sessions.find((s) => s.id === currentSessionId);
        if (activeSession && activeSession.messages.length > 0) {
          saveUserSessionToSupabase(user.id, activeSession);
        }
      }
    } else {
      // Guest mode caching
      if (sessions.length > 0) {
        localStorage.setItem(getGuestStorageKey(), JSON.stringify(sessions));
      }
    }
  }, [sessions, user, currentSessionId]);

  // Current Active Session
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Scroll to bottom ONLY when active messages exist
  useEffect(() => {
    if (messages.length > 0 && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  // Create New Chat
  const handleNewChat = () => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `session_${Date.now()}`;

    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    };

    if (!user) {
      setSessions([newSession]);
      setCurrentSessionId(newId);
    } else {
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newId);
      localStorage.setItem(getUserActiveKey(user.id), newId);
    }

    window.scrollTo(0, 0);

    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.15 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899']
    });

    setToast({
      id: Date.now().toString(),
      message: '✨ Started a new chat session.',
      type: 'info',
    });
  };

  // Delete Session
  const handleDeleteSession = (sessionIdToDelete: string) => {
    const updated = sessions.filter((s) => s.id !== sessionIdToDelete);

    if (user) {
      deleteUserSessionFromSupabase(user.id, sessionIdToDelete);
    }

    if (updated.length === 0) {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `session_${Date.now()}`;
      const freshSession: ChatSession = {
        id: newId,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSessions([freshSession]);
      setCurrentSessionId(newId);
      
      if (user) {
        localStorage.setItem(getUserActiveKey(user.id), newId);
        localStorage.setItem(getUserStorageKey(user.id), JSON.stringify([freshSession]));
      }
    } else {
      setSessions(updated);
      if (currentSessionId === sessionIdToDelete) {
        const nextActiveId = updated[0].id;
        setCurrentSessionId(nextActiveId);
        if (user) {
          localStorage.setItem(getUserActiveKey(user.id), nextActiveId);
        }
      }
      if (user) {
        localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(updated));
      }
    }

    window.scrollTo(0, 0);
    setToast({
      id: Date.now().toString(),
      message: '🗑️ Chat session deleted.',
      type: 'info',
    });
  };

  // User Auth Handlers
  const handleLoginSuccess = async (authenticatedUser: UserProfile, token: string) => {
    setUser(authenticatedUser);
    localStorage.setItem('nexus_token', token);
    
    await loadUserSessions(authenticatedUser.id);

    setToast({
      id: Date.now().toString(),
      message: `🎉 Welcome back, ${authenticatedUser.name}!`,
      type: 'success',
    });
  };

  const handleLogout = () => {
    supabase.auth.signOut().catch(console.error);
    setUser(null);
    localStorage.removeItem('nexus_token');
    handleGuestInit();

    setToast({
      id: Date.now().toString(),
      message: 'Signed out successfully.',
      type: 'info',
    });
  };

  const parseResponseText = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (Array.isArray(data) && data.length > 0) return parseResponseText(data[0]);
    if (typeof data === 'object') {
      return data.output || data.text || data.message || data.response || data.result || JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  // Send Message Handler - Immediately Inserts Message Rows into Supabase 'chat_history'
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : `msg_${Date.now()}_user`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    if (user) {
      saveChatMessageToSupabase(user.id, userMessage);
    }

    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          const newTitle = session.messages.length === 0 
            ? text.slice(0, 30) + (text.length > 30 ? '...' : '')
            : session.title;
          return {
            ...session,
            title: newTitle,
            messages: [...session.messages, userMessage],
          };
        }
        return session;
      })
    );

    setIsLoading(true);

    if (webhookUrl && webhookUrl.trim().length > 0) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatInput: text,
            sessionId: currentSessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = parseResponseText(data);

        if (responseText) {
          const botMsgId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `msg_${Date.now()}_bot`;

          const botMessage: ChatMessage = {
            id: botMsgId,
            sender: 'bot',
            text: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          if (user) {
            saveChatMessageToSupabase(user.id, botMessage);
          }

          setSessions((prevSessions) =>
            prevSessions.map((session) => {
              if (session.id === currentSessionId) {
                return {
                  ...session,
                  messages: [...session.messages, botMessage],
                };
              }
              return session;
            })
          );
        }
      } catch (err: any) {
        console.error('Webhook Endpoint Error:', err);
        setToast({
          id: Date.now().toString(),
          message: `⚠️ Connection Error: ${err.message || 'Unable to connect to webhook endpoint'}.`,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setToast({
          id: Date.now().toString(),
          message: '⚙️ Webhook URL not configured in VITE_N8N_WEBHOOK_URL environment variable.',
          type: 'info',
        });
      }, 600);
    }
  };

  return (
    <div className={`relative min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 transition-all duration-300 ${sidebarOpen ? 'md:pl-[280px] overflow-hidden max-h-screen md:max-h-none md:overflow-visible' : ''}`}>
      
      {/* Background Ambient Radial Glow Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none animate-glow-1 z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-purple-600/15 blur-[130px] pointer-events-none animate-glow-2 z-0" />
      <div className="fixed top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-pink-600/10 blur-[140px] pointer-events-none z-0" />

      {/* Global Toast Alert */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Drawer Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          if (user) {
            localStorage.setItem(getUserActiveKey(user.id), id);
          }
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Sticky Main Header - Pinned at top */}
      <ChatHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-between w-full max-w-4xl mx-auto px-4 pt-16 pb-4 z-10 min-h-[calc(100vh-4rem)]">
        {messages.length === 0 ? (
          <WelcomeState
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        ) : (
          <div className="w-full flex-1 flex flex-col justify-between pt-4 pb-2">
            <div className="space-y-4 mb-4">
              {messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}

              {isLoading && <TypingIndicator />}
              
              <div ref={chatBottomRef} />
            </div>

            {/* Sticky Input Bar at Bottom during active conversation */}
            <div className="sticky bottom-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/90 to-transparent pt-4 pb-3 mt-auto w-full z-20">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask Nexus AI anything..."
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
