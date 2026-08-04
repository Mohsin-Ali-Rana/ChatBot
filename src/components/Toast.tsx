import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { ToastAlert } from '../types/chat';

interface ToastProps {
  toast: ToastAlert | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-[92%]"
        >
          <div className={`p-4 rounded-2xl glass-card border backdrop-blur-xl shadow-2xl flex items-start gap-3 ${
            toast.type === 'error' 
              ? 'bg-slate-900/90 border-rose-500/30 text-rose-200 shadow-rose-500/10' 
              : toast.type === 'success' 
              ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-200 shadow-emerald-500/10' 
              : 'bg-slate-900/90 border-indigo-500/30 text-indigo-200 shadow-indigo-500/10'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-xs sm:text-sm font-medium leading-normal">
              {toast.message}
            </div>

            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
