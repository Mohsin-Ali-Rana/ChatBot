import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Plus, Search, Trash2, Crown, User, LogOut, 
  ChevronLeft, ShieldCheck 
} from 'lucide-react';
import { ChatSession, UserProfile } from '../types/chat';
import { NexusLogo } from './NexusLogo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lock body scroll when sidebar drawer is open ONLY on mobile (<768px)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile backdrop overlay with touch-none to block background scrolling */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 md:hidden touch-none"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 bottom-0 z-40 h-full w-[280px] bg-[#0d1322]/95 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        <div className="p-4 flex flex-col h-full min-w-[280px]">
          {/* Header Branding + Hide Button */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <NexusLogo size="sm" showText={true} />

            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) {
                onToggle();
              }
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Session</span>
          </button>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/60 transition-all"
            />
          </div>

          {/* Guest Mode Banner */}
          {!user && (
            <div className="mb-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-200 mb-0.5">Guest Mode Active</span>
                <span className="text-slate-400 leading-tight block">
                  Sign in to save chat history across devices.
                </span>
                <button
                  onClick={() => {
                    onOpenAuth();
                    if (window.innerWidth < 768) {
                      onToggle();
                    }
                  }}
                  className="mt-1.5 font-bold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Sign In / Register &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Chat History List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 my-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Recent Conversations
            </div>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No conversations found
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) {
                        onToggle();
                      }
                    }}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-6">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="truncate">{session.title}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Upgrade to Pro Card */}
          <div className="my-3 p-3 rounded-2xl bg-gradient-to-tr from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
              <Crown className="w-4 h-4" /> Pro Workspace Access
            </div>
            <p className="text-[11px] text-slate-300 leading-normal mb-2.5">
              Unlock priority LLM routing, unlimited sessions & team workspaces.
            </p>
            <button className="w-full py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold transition-all">
              Upgrade Account
            </button>
          </div>

          {/* Footer User Info */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            {user ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-indigo-500/40 bg-slate-900 flex-shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Pro Member</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  if (window.innerWidth < 768) {
                    onToggle();
                  }
                }}
                className="flex-1 flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white py-1.5 px-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>Sign In / Register</span>
              </button>
            )}

            {user && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};
