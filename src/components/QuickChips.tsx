import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Code, FileText, Lightbulb, Compass, Zap } from 'lucide-react';
import { QuickChipItem } from '../types/chat';

interface QuickChipsProps {
  onSelectChip: (promptText: string) => void;
  disabled?: boolean;
}

const DEFAULT_CHIPS: QuickChipItem[] = [
  {
    id: 'chip-brainstorm',
    label: 'Brainstorm creative concepts',
    iconName: 'Lightbulb',
    promptText: '💡 Brainstorm 5 innovative concepts and strategic angles for my project.',
  },
  {
    id: 'chip-summarize',
    label: 'Summarize key points',
    iconName: 'FileText',
    promptText: '📝 Extract and synthesize the core key points from our conversation.',
  },
  {
    id: 'chip-code',
    label: 'Write & optimize code',
    iconName: 'Code',
    promptText: '💻 Help me write clean, efficient, production-ready code with error handling.',
  },
  {
    id: 'chip-explore',
    label: 'Explore complex topic',
    iconName: 'Compass',
    promptText: '🔍 Provide a deep-dive analysis explaining the fundamental architecture of this topic.',
  },
];

export const QuickChips: React.FC<QuickChipsProps> = ({ onSelectChip, disabled }) => {
  const getIcon = (name?: string) => {
    switch (name) {
      case 'Lightbulb': return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'FileText': return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Code': return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Compass': return <Compass className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
    }
  };

  return (
    <div className="w-full py-2 px-1">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
        {DEFAULT_CHIPS.map((chip, index) => (
          <motion.button
            key={chip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ scale: disabled ? 1 : 1.03 }}
            whileTap={{ scale: disabled ? 1 : 0.96 }}
            onClick={() => !disabled && onSelectChip(chip.promptText)}
            disabled={disabled}
            className={`glass-chip flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap text-slate-200 border border-white/10 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-white'
            }`}
          >
            {getIcon(chip.iconName)}
            <span>{chip.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
