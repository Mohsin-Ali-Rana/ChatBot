import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types/chat';
import { supabase } from '../lib/supabase';
import { NexusLogo } from './NexusLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form fields whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setError('');
      setIsSignUp(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // Input Validation
    if (isSignUp && (!name || !name.trim())) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Supabase Auth Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        const user = data.user;
        const session = data.session;

        if (!user) {
          throw new Error('Sign up failed. Please check your information and try again.');
        }

        const userName = name.trim() || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const userAvatar = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

        const authenticatedUser: UserProfile = {
          id: user.id,
          name: userName,
          email: user.email || email.trim(),
          avatarUrl: userAvatar,
          isPro: true,
        };

        const token = session?.access_token || `sb_token_${user.id}`;

        resetForm();
        onLoginSuccess(authenticatedUser, token);
        onClose();
      } else {
        // Supabase Auth Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw new Error(signInError.message);
        }

        const user = data.user;
        const session = data.session;

        if (!user) {
          throw new Error('Sign in failed. User record not found.');
        }

        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const userAvatar = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

        const authenticatedUser: UserProfile = {
          id: user.id,
          name: userName,
          email: user.email || email.trim(),
          avatarUrl: userAvatar,
          isPro: true,
        };

        const token = session?.access_token || `sb_token_${user.id}`;

        resetForm();
        onLoginSuccess(authenticatedUser, token);
        onClose();
      }
    } catch (err: any) {
      console.error('Supabase Auth Error:', err);
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 flex items-center justify-center min-h-screen">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseModal}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden glass-card rounded-3xl p-5 sm:p-6 border border-white/15 shadow-2xl z-10 my-auto scrollbar-thin flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-3 sm:mb-4 flex-shrink-0 flex flex-col items-center">
            <div className="mb-2">
              <NexusLogo size="md" showText={false} />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isSignUp ? 'Create your Account' : 'Welcome Back'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isSignUp 
                ? 'Join Nexus AI to unlock next-gen workspace intelligence.' 
                : 'Sign in to access your saved workspace chats.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 mb-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); resetForm(); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !isSignUp 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); resetForm(); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSignUp 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 flex-shrink-0 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 flex-1">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    autoComplete="off"
                    className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@workspace.ai"
                  autoComplete="off"
                  className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-slate-300">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] text-indigo-400 hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Social Divider */}
          <div className="relative my-3 text-center flex-shrink-0">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative bg-[#0d1322] px-2 text-[10px] text-slate-400 font-medium">
              Or continue with
            </span>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setName('Demo User');
                setEmail('demo@workspace.ai');
                setPassword('password123');
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={() => {
                setName('Demo Developer');
                setEmail('developer@workspace.ai');
                setPassword('password123');
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
