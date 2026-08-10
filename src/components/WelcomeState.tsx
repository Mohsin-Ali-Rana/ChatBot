import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Code, Terminal, Layers, ArrowUpRight } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { QuickChips } from './QuickChips';
import { NexusLogo } from './NexusLogo';

interface WelcomeStateProps {
  onSendMessage: (promptText: string) => void;
  isLoading: boolean;
}

export const WelcomeState: React.FC<WelcomeStateProps> = ({ onSendMessage, isLoading }) => {
  const cards = [
    {
      title: 'Code & Architecture',
      desc: 'Build, debug, and optimize complex software systems.',
      icon: Code,
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/60',
      prompt: 'Write a high-performance React component with custom hooks and TypeScript types.'
    },
    {
      title: 'Data & Analysis',
      desc: 'Synthesize complex metrics into clear executive reports.',
      icon: Terminal,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 hover:border-purple-500/60',
      prompt: 'Analyze key performance indicators and provide strategic growth recommendations.'
    },
    {
      title: 'Creative Strategy',
      desc: 'Draft high-impact content, positioning, and concepts.',
      icon: Sparkles,
      color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30 hover:border-pink-500/60',
      prompt: 'Brainstorm 5 compelling marketing positioning concepts for a new tech launch.'
    },
    {
      title: 'Workflow Orchestration',
      desc: 'Automate multi-step background tasks and integrations.',
      icon: Layers,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60',
      prompt: 'Design a scalable multi-step API integration architecture for webhooks.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center px-2 sm:px-4 space-y-4 sm:space-y-6 my-auto py-4"
    >
      {/* 1. Hero Animated NexusLogo & Title */}
      <div className="flex flex-col items-center">
        <div className="mb-2 sm:mb-3">
          <NexusLogo size="lg" showText={false} />
        </div>

        <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1.5 sm:mb-2 max-w-2xl leading-tight px-2">
          How can <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Nexus AI</span> elevate your work today?
        </h2>
        
        <p className="text-[11px] sm:text-sm text-slate-400 max-w-md leading-relaxed px-2">
          Select a prompt starter below or type a command to initialize your workspace assistant.
        </p>
      </div>

      {/* 2. Main Central Input Console */}
      <div className="w-full">
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>

      {/* 3. Quick Action Suggestion Chips */}
      <div className="w-full">
        <QuickChips onSelectChip={onSendMessage} disabled={isLoading} />
      </div>

      {/* 4. Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full text-left pt-1">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSendMessage(card.prompt)}
              className={`glass-card p-3.5 sm:p-4 rounded-2xl border ${card.color} cursor-pointer group transition-all relative overflow-hidden shadow-lg`}
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                  <Icon className="w-4 h-4" />
                  <span>{card.title}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-white" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
