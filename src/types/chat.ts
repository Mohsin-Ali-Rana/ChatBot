export type MessageSender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface QuickChipItem {
  id: string;
  label: string;
  iconName?: string;
  promptText: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isPro?: boolean;
}

export interface ToastAlert {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export type AIModel = 'gemini-2.0-flash' | 'gpt-4o' | 'claude-3-5-sonnet';
