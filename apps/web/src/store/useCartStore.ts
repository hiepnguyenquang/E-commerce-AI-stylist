import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  stylistSessionId?: string; // metadata tracking
}

interface CartState {
  items: CartItem[];
  isOpen: boolean; // Trạng thái mở/đóng giỏ hàng
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === existingItem.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              isOpen: true, // Auto open cart when adding
            };
          }
          return { items: [...state.items, item], isOpen: true };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'ai-fashion-cart-storage',
      partialize: (state) => ({ items: state.items }), // Chỉ lưu items, không lưu trạng thái isOpen
    }
  )
);