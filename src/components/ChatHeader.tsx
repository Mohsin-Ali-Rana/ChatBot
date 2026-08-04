import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, PanelLeft, ChevronDown, User, LogOut, Settings, Cpu } from 'lucide-react';
import { UserProfile, AIModel } from '../types/chat';

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  currentModel: AIModel;
  onSelectModel: (model: AIModel) => void;
  onOpenSettings: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  user,
  onOpenAuth,
  onLogout,
  currentModel,
  onSelectModel,
  onOpenSettings,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getModelLabel = (model: AIModel) => {
    switch (model) {
      case 'gemini-2.0-flash': return 'Gemini 2.0 Flash';
      case 'gpt-4o': return 'GPT-4o Intelligence';
      case 'claude-3-5-sonnet': return 'Claude 3.5 Sonnet';
      default: return 'Gemini 2.0 Flash';
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-30 w-full glass-header px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 shadow-lg backdrop-blur-xl bg-[#0b0f19]/85">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left Side: Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Toggle Sidebar Drawer"
          >
            <PanelLeft className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25">
                <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-4 sm:h-4 text-indigo-300 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-[#0b0f19]"></span>
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">Nexus AI</h1>
                <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-purple-500/30 text-[9px] sm:text-[10px] font-bold text-purple-300 uppercase tracking-wider flex-shrink-0">
                  PRO
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 hidden md:inline truncate">Next-Gen Intelligence Workspace</span>
            </div>
          </div>
        </div>

        {/* Center: Model Dropdown Selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate max-w-[95px] sm:max-w-none">{getModelLabel(currentModel)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 glass-card rounded-2xl p-1.5 border border-white/15 shadow-2xl z-50">
              {[
                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Fastest reasoning' },
                { id: 'gpt-4o', name: 'GPT-4o', desc: 'High precision' },
                { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'Creative nuance' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectModel(m.id as AIModel);
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-colors ${
                    currentModel === m.id
                      ? 'bg-indigo-600/20 text-white font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{m.name}</div>
                  <div className="text-[10px] text-slate-400">{m.desc}</div>
                </button>
              ))}
            </div>
          )}
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
            <span className="hidden sm:inline">New Chat</span>
          </motion.button>

          {/* User Auth Profile Trigger */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-indigo-500/40 bg-slate-900 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-indigo-500/40 transition-all"
              >
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded-2xl p-2 border border-white/15 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-white/10 text-xs font-semibold transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sign In</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
