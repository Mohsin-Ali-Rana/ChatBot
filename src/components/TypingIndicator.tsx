import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 my-3"
    >
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 flex-shrink-0 shadow-md shadow-indigo-500/20">
        <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center">
          <Bot className="w-4 h-4 text-indigo-300" />
        </div>
      </div>

      {/* Typing Bubble */}
      <div className="glass-card-bot px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border border-white/10 max-w-[200px]">
        <span className="text-xs text-indigo-300 font-medium mr-1.5">Assistant is thinking</span>
        <div className="flex items-center gap-1">
          <motion.span
            className="w-2 h-2 rounded-full bg-indigo-400"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
          />
          <motion.span
            className="w-2 h-2 rounded-full bg-purple-400"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.15, ease: "easeInOut" }}
          />
          <motion.span
            className="w-2 h-2 rounded-full bg-pink-400"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.3, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};
