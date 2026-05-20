import { create } from 'zustand';

export interface OutfitItem {
  id: string;
  title: string;
  thumbnail: string | null;
  variants: any[];
  type: 'store' | 'closet';
  clothing_type?: string;
}

export interface OutfitOption {
  option_id: string;
  title: string;
  reasoning: string;
  items: OutfitItem[]; // Đã hydrate từ Backend
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
  replaceItemInMessage: (messageId: string, optionId: string, oldItemId: string, newItem: OutfitItem) => void;
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
  
  replaceItemInMessage: (messageId, optionId, oldItemId, newItem) => set((state) => {
    return {
      messages: state.messages.map(msg => {
        if (msg.id !== messageId || !msg.options) return msg;
        
        return {
          ...msg,
          options: msg.options.map(opt => {
            if (opt.option_id !== optionId) return opt;
            
            return {
              ...opt,
              items: opt.items.map(item => item.id === oldItemId ? newItem : item)
            };
          })
        };
      })
    };
  }),
}));
