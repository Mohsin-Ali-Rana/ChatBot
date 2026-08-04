import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check, Volume2, VolumeX, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      } else {
        window.speechSynthesis.cancel(); // clear previous
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
      }
    }
  };

  // Helper to render basic markdown-style formatting (bold, code blocks, lists)
  const renderFormattedText = (content: string) => {
    // If text contains code blocks with backticks
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('```')) {
          const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <div key={idx} className="my-2 rounded-xl overflow-hidden bg-slate-950 border border-white/10 text-xs font-mono">
              {lang && (
                <div className="bg-slate-900/90 px-3 py-1 text-[10px] text-slate-400 border-b border-white/5 font-bold uppercase tracking-wider">
                  {lang}
                </div>
              )}
              <pre className="p-3 overflow-x-auto text-emerald-300">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }
        return <p key={idx} className="whitespace-pre-wrap">{part}</p>;
      });
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
      className={`flex items-start gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
        isUser 
          ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-purple-500/20' 
          : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-indigo-200 p-0.5 shadow-indigo-500/20'
      }`}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-300" />
          </div>
        )}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Timestamp */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">{isUser ? 'You' : 'AI Assistant'}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
          {message.status === 'sending' && (
            <span className="text-indigo-400 animate-pulse font-medium">sending...</span>
          )}
        </div>

        {/* Card Body */}
        <div className={`relative px-4 py-3 rounded-2xl text-sm sm:text-[15px] ${
          isUser 
            ? 'glass-card-user text-white rounded-tr-sm' 
            : 'glass-card-bot text-slate-100 rounded-tl-sm'
        }`}>
          {renderFormattedText(message.text)}

          {/* Action Buttons for Bot Responses */}
          {!isUser && (
            <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-white/10 hover:text-slate-200 transition-colors flex items-center gap-1"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied && <span className="text-[10px] text-emerald-400 font-medium">Copied</span>}
                </button>

                <button
                  onClick={handleSpeak}
                  className={`p-1 rounded-md hover:bg-white/10 transition-colors ${speaking ? 'text-indigo-400' : 'hover:text-slate-200'}`}
                  title={speaking ? "Stop reading" : "Read aloud"}
                >
                  {speaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Feedback controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`p-1 rounded-md hover:bg-white/10 transition-colors ${liked === true ? 'text-emerald-400' : 'hover:text-slate-200'}`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`p-1 rounded-md hover:bg-white/10 transition-colors ${liked === false ? 'text-rose-400' : 'hover:text-slate-200'}`}
                  title="Poor response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
