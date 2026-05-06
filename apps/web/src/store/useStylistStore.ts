import { create } from 'zustand';

export interface OutfitOption {
  option_id: string;
  title: string;
  reasoning: string;
  items: string[]; // List of product IDs
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  options?: OutfitOption[];
}

interface StylistState {
  messages: Message[];
  isTyping: boolean;
  
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  clearChat: () => void;
}

export const useStylistStore = create<StylistState>((set) => ({
  messages: [
    {
      id: 'welcome_msg',
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Stylist của bạn. Bạn muốn tìm trang phục phong cách nào cho dịp gì hôm nay?',
    }
  ],
  isTyping: false,

  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
    
  setTyping: (isTyping) => set({ isTyping }),
  
  clearChat: () => set({ 
    messages: [
      {
        id: 'welcome_msg',
        role: 'assistant',
        content: 'Xin chào! Tôi là AI Stylist của bạn. Bạn muốn tìm trang phục phong cách nào cho dịp gì hôm nay?',
      }
    ], 
    isTyping: false 
  }),
}));
