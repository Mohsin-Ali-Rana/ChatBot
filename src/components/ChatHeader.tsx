import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, PanelLeft, User, LogOut } from 'lucide-react';
import { UserProfile } from '../types/chat';
import { NexusLogo } from './NexusLogo';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-30 w-full glass-header px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 shadow-lg backdrop-blur-xl bg-[#0b0f19]/85">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left Side: Sidebar Toggle + Brand NexusLogo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Toggle Sidebar Drawer"
          >
            <PanelLeft className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </button>

          <div className="flex items-center gap-2">
            <NexusLogo size="sm" showText={true} />
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-purple-500/30 text-[9px] font-bold text-purple-300 uppercase tracking-wider flex-shrink-0">
              PRO
            </span>
          </div>
        </div>

        {/* Right Side: New Chat + Auth Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-semibold transition-all shadow-md group"
            title="Start new chat"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-200 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">New Session</span>
          </motion.button>

          {/* User Auth Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-indigo-500/40 bg-slate-900"
                />
                <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 border border-white/15 p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
