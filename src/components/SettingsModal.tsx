import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Cpu, Save, ShieldCheck, Database, Key } from 'lucide-react';
import { AIModel } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSaveWebhookUrl: (url: string) => void;
  currentModel: AIModel;
  onSelectModel: (model: AIModel) => void;
  onClearAllSessions: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  onSaveWebhookUrl,
  currentModel,
  onSelectModel,
  onClearAllSessions,
}) => {
  const [urlInput, setUrlInput] = useState(webhookUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWebhookUrl(urlInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg glass-card rounded-3xl p-6 border border-white/15 shadow-2xl z-10 overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Workspace Settings</h3>
              <p className="text-xs text-slate-400">Configure your LLM model preferences and webhook endpoint.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* n8n Webhook Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>n8n Webhook Endpoint URL</span>
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/chat"
                className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-indigo-200 placeholder-slate-600 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Requests are dispatched via POST payload: <code className="text-indigo-300 font-mono">&#123; "chatInput", "sessionId" &#125;</code>
              </p>
            </div>

            {/* AI Model Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Default Intelligence Model</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gemini-2.0-flash', label: 'Gemini 2.0', tag: 'Fast' },
                  { id: 'gpt-4o', label: 'GPT-4o', tag: 'Smart' },
                  { id: 'claude-3-5-sonnet', label: 'Claude 3.5', tag: 'Creative' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectModel(m.id as AIModel)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      currentModel === m.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[10px] text-indigo-300 font-mono mt-0.5">{m.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Data Section */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-400" /> Reset All Local History
                </div>
                <div className="text-[10px] text-slate-400">Clear stored session keys and local message logs.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClearAllSessions();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                Clear Data
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
