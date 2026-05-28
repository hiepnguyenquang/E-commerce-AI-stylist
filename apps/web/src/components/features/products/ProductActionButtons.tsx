'use client';

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useVTONService } from '@/hooks/useVTONService';
import { useVTONStore } from '@/store/useVTONStore';
import { Sparkles, ShoppingBag } from 'lucide-react';

interface ProductProps {
  product: {
    id: string;
    title: string;
    thumbnail: string | null;
    variants: any[];
  }
}

export default function ProductActionButtons({ product }: ProductProps) {
  const cartStore = useCartStore();
  const vtonStore = useVTONStore();
  const { startTryOn } = useVTONService("default_user");

  const handleAddToCart = () => {
    const variantId = product.variants?.[0]?.id || `mock_variant_${product.id}`;
    // Lấy giá từ variant (prices[0].amount) nếu có, hoặc dùng mock
    const price = product.variants?.[0]?.calculated_price?.calculated_amount || product.variants?.[0]?.prices?.[0]?.amount || 150000;

    cartStore.addItem({
      id: `cart_${Date.now()}_${product.id}`,
      productId: product.id,
      variantId: variantId,
      title: product.title,
      imageUrl: product.thumbnail,
      quantity: 1,
      unitPrice: price,
    });
  };

  const handleTryOn = () => {
    if (!product.thumbnail) {
      alert("Sản phẩm này chưa có hình ảnh để thử.");
      return;
    }
    if (!vtonStore.humanImageUrl) {
      alert("Bạn chưa thiết lập Hồ sơ AI. Vui lòng vào trang Hồ sơ AI để tải ảnh lên trước.");
      return;
    }
    
    startTryOn(vtonStore.humanImageUrl, product.thumbnail);
  };

  return (
    <div className="flex flex-col space-y-2.5 w-full mt-5">
      <button 
        onClick={handleAddToCart}
        className="w-full border border-zinc-200/80 text-zinc-800 bg-white font-bold py-3 px-4 rounded-xl hover:bg-zinc-50 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
      >
        <ShoppingBag size={18} className="group-hover/btn:scale-110 transition-transform duration-300 text-zinc-700" />
        <span>Thêm vào Giỏ</span>
      </button>
      
      <div className="w-full mt-2 p-2 bg-zinc-50/80 border border-zinc-100 rounded-xl flex items-center justify-between">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-2">AI Engine</span>
        <div className="flex bg-zinc-200/50 p-1 rounded-lg">
          <button 
            onClick={() => vtonStore.setEngine('local')} 
            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${vtonStore.engine === 'local' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Local
          </button>
          <button 
            onClick={() => vtonStore.setEngine('cloud')} 
            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${vtonStore.engine === 'cloud' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            FLUX <Sparkles size={10} className={vtonStore.engine === 'cloud' ? 'text-zinc-300' : ''}/>
          </button>
        </div>
      </div>
      
      <button 
        onClick={handleTryOn}
        className="w-full bg-zinc-950 text-white font-black py-3 px-4 rounded-xl hover:bg-zinc-850 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group/btn2 shadow-md"
      >
        <Sparkles size={18} className="group-hover/btn2:animate-pulse text-zinc-200" />
        <span>Thử đồ ảo (VTON)</span>
      </button>
    </div>
  );
}
