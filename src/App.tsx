import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { ChatHeader } from './components/ChatHeader';
import { Sidebar } from './components/Sidebar';
import { ChatMessageComponent } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { WelcomeState } from './components/WelcomeState';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

import { ChatMessage, ChatSession, UserProfile, ToastAlert } from './types/chat';
import { 
  supabase, 
  fetchUserSessionsFromSupabase, 
  saveUserSessionToSupabase, 
  deleteUserSessionFromSupabase 
} from './lib/supabase';

const LOCAL_STORAGE_SESSION_KEY = 'nexus_current_session_id';
const LOCAL_STORAGE_SESSIONS_LIST_KEY = 'nexus_chat_sessions';

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

  // 1. Initial Load: Authenticate User & Load Sessions from Supabase
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
          loadUserSessions(sbUser.id);
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
        loadUserSessions(sbUser.id);
      } else if (event === 'SIGNED_OUT') {
        handleGuestInit();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadUserSessions = async (userId: string) => {
    const remoteSessions = await fetchUserSessionsFromSupabase(userId);
    let initialSessions: ChatSession[] = remoteSessions || [];

    if (initialSessions.length === 0) {
      const savedSessionsStr = localStorage.getItem(LOCAL_STORAGE_SESSIONS_LIST_KEY);
      if (savedSessionsStr) {
        try {
          initialSessions = JSON.parse(savedSessionsStr);
        } catch (e) {
          console.error('Failed to parse local sessions', e);
        }
      }
    }

    let activeId = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY) || '';

    if (initialSessions.length === 0) {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `session_${Date.now()}`;
      initialSessions = [{
        id: newId,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [],
      }];
      activeId = newId;
    } else if (!activeId || !initialSessions.some((s) => s.id === activeId)) {
      activeId = initialSessions[0].id;
    }

    setSessions(initialSessions);
    setCurrentSessionId(activeId);
  };

  const handleGuestInit = () => {
    const guestId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `session_${Date.now()}`;
    const guestSession: ChatSession = {
      id: guestId,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setUser(null);
    setSessions([guestSession]);
    setCurrentSessionId(guestId);
  };

  // Save sessions to localStorage & Supabase DB on update ONLY if logged in
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_LIST_KEY, JSON.stringify(sessions));
      const activeSession = sessions.find((s) => s.id === currentSessionId);
      if (activeSession) {
        saveUserSessionToSupabase(user.id, activeSession);
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
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, newId);
      saveUserSessionToSupabase(user.id, newSession);
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
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, newId);
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_LIST_KEY, JSON.stringify([freshSession]));
        saveUserSessionToSupabase(user.id, freshSession);
      }
    } else {
      setSessions(updated);
      if (currentSessionId === sessionIdToDelete) {
        const nextActiveId = updated[0].id;
        setCurrentSessionId(nextActiveId);
        if (user) {
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, nextActiveId);
        }
      }
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_LIST_KEY, JSON.stringify(updated));
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
    localStorage.removeItem(LOCAL_STORAGE_SESSIONS_LIST_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    
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

  // Send Message Handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

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
          const botMessage: ChatMessage = {
            id: `msg_${Date.now()}_bot`,
            sender: 'bot',
            text: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

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
    <div className={`relative min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 transition-all duration-300 ${sidebarOpen ? 'md:pl-[280px]' : ''}`}>
      
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

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          if (user) {
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, id);
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
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-6 flex flex-col justify-between">
        
        {messages.length === 0 ? (
          /* Empty State: Natural Flow with Center Focus Input */
          <div className="flex-1 flex flex-col justify-center my-auto">
            <WelcomeState onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        ) : (
          /* Active Chat Feed & Fixed Bottom Input Console */
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="flex-1 space-y-4 pb-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessageComponent key={msg.id} message={msg} />
                ))}
              </AnimatePresence>

              {isLoading && <TypingIndicator />}
              <div ref={chatBottomRef} className="h-2" />
            </div>

            <div className="sticky bottom-0 pt-2 pb-3 sm:pb-4 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/95 to-transparent z-20">
              <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
