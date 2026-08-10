import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check, Volume2, VolumeX, ThumbsUp, ThumbsDown, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Custom CodeBlock Component with Language Tag & Copy Code Button
const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden bg-[#090d16] border border-white/15 shadow-xl max-w-full w-full">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-white/10 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="uppercase font-bold tracking-wider text-slate-300">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-medium text-[10px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans font-medium text-[10px]">Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content Area */}
      <pre className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-indigo-200 scrollbar-thin max-w-full">
        <code>{value}</code>
      </pre>
    </div>
  );
};

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
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
      }
    }
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
      className={`flex items-start gap-2.5 sm:gap-3 my-3.5 max-w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
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
      <div className={`flex flex-col max-w-[88%] sm:max-w-[85%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Timestamp */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">{isUser ? 'You' : 'Nexus AI'}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
          {message.status === 'sending' && (
            <span className="text-indigo-400 animate-pulse font-medium">sending...</span>
          )}
        </div>

        {/* Card Body */}
        <div className={`relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-sm sm:text-[15px] max-w-full overflow-hidden break-words shadow-lg ${
          isUser 
            ? 'glass-card-user text-white rounded-tr-sm' 
            : 'glass-card-bot text-slate-100 rounded-tl-sm border border-white/10'
        }`}>
          {/* ReactMarkdown rendering message text with custom typography formatting */}
          <div className="markdown-body prose prose-invert max-w-none text-slate-100 leading-relaxed text-sm sm:text-[15px] break-words overflow-hidden">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed break-words">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-indigo-200">{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-200">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-200">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg sm:text-xl font-extrabold text-white mt-4 mb-2 border-b border-white/10 pb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold text-white mt-3.5 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold text-indigo-300 mt-3 mb-1">{children}</h3>,
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-white/15 shadow-md">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-slate-900/90 text-indigo-300 font-bold border-b border-white/10">{children}</thead>,
                tr: ({ children }) => <tr className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">{children}</tr>,
                th: ({ children }) => <th className="px-3.5 py-2 font-semibold">{children}</th>,
                td: ({ children }) => <td className="px-3.5 py-2 text-slate-300">{children}</td>,
                code: ({ className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const content = String(children).replace(/\n$/, '');
                  const isMultiLine = content.includes('\n') || Boolean(match);

                  if (isMultiLine) {
                    return <CodeBlock language={language} value={content} />;
                  }

                  return (
                    <code className="px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-white/15 text-indigo-300 font-mono text-[13px] break-all inline-block" {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/30 px-3.5 py-2 my-3 rounded-r-xl text-slate-300 text-xs sm:text-sm italic">
                    {children}
                  </blockquote>
                ),
                img: ({ src, alt }) => (
                  <img src={src} alt={alt} className="max-w-full h-auto rounded-xl border border-white/10 my-2.5 shadow-md" />
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>

          {/* Action Buttons for Bot Responses */}
          {!isUser && (
            <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-slate-200 transition-colors flex items-center gap-1"
                  title="Copy full response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? <span className="text-[10px] text-emerald-400 font-medium">Copied</span> : <span className="text-[10px]">Copy</span>}
                </button>

                <button
                  onClick={handleSpeak}
                  className={`px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 ${speaking ? 'text-indigo-400 bg-indigo-500/10' : 'hover:text-slate-200'}`}
                  title={speaking ? "Stop reading" : "Read aloud"}
                >
                  {speaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{speaking ? 'Stop' : 'Listen'}</span>
                </button>
              </div>

              {/* Feedback controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${liked === true ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-slate-200'}`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${liked === false ? 'text-rose-400 bg-rose-500/10' : 'hover:text-slate-200'}`}
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
