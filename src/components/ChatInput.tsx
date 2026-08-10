import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowUp, Globe, Plus } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, placeholder }) => {
  const [text, setText] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setText('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-0">
      <form onSubmit={handleSubmit} className="relative">
        {/* Futuristic Floating Glass Input Capsule */}
        <div className="relative rounded-3xl bg-[#0f172a]/85 backdrop-blur-2xl border border-indigo-500/20 hover:border-indigo-500/40 focus-within:border-indigo-500/70 focus-within:ring-4 focus-within:ring-indigo-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.15)] transition-all duration-300 overflow-hidden p-3 sm:p-4">
          
          {/* Ambient Glow Subtle Highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

          {/* Text Area Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask Nexus AI anything... (Press Enter to send)"}
            disabled={isLoading}
            className="w-full bg-transparent border-0 outline-none focus:outline-none resize-none text-slate-100 placeholder-slate-400/70 text-sm sm:text-base py-1 px-1 min-h-[44px] max-h-[180px] leading-relaxed relative z-10 scrollbar-thin"
          />

          {/* Integrated Action Toolbar Footer */}
          <div className="relative z-10 flex items-center justify-between pt-2.5 mt-1 border-t border-white/10">
            
            {/* Left Tools: File Attach, Web Search Toggle, Voice */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 text-xs font-medium transition-colors"
                title="Attach file or context"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  webSearchEnabled 
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/20' 
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Web Search context"
              >
                <Globe className={`w-3.5 h-3.5 ${webSearchEnabled ? 'text-indigo-400 animate-spin-slow' : 'text-slate-400'}`} />
                <span>Search</span>
              </button>

              <button
                type="button"
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-400 hover:text-purple-400 transition-colors hidden sm:flex"
                title="Voice input"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Tools: Send Button & Character Count Indicator */}
            <div className="flex items-center gap-2">
              {text.trim().length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {text.trim().length} chars
                </span>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: text.trim() && !isLoading ? 1.05 : 1 }}
                whileTap={{ scale: text.trim() && !isLoading ? 0.95 : 1 }}
                disabled={!text.trim() || isLoading}
                className={`p-2.5 sm:px-4 sm:py-2.5 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2 ${
                  text.trim() && !isLoading
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 cursor-pointer'
                    : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
                title="Send message"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline text-xs">Send</span>
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Clean floating disclaimer text without black box background */}
        <div className="text-center mt-2.5 text-[11px] text-slate-400/80 font-medium tracking-wide">
          <span>Nexus AI may produce inaccurate info. Verify key details.</span>
        </div>
      </form>
    </div>
  );
};
