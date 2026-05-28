'use client';

import { useState } from 'react';
import { OutfitOption, OutfitItem, useStylistStore } from '@/store/useStylistStore';
import { useVTONStore } from '@/store/useVTONStore';
import { useVTONService } from '@/hooks/useVTONService';
import { useCartStore } from '@/store/useCartStore';

export default function OutfitCard({ option, messageId }: { option: OutfitOption, messageId?: string }) {
  const vtonStore = useVTONStore();
  const { startMultiStepTryOn } = useVTONService("default_user");
  const cartStore = useCartStore();
  const { replaceItemInMessage } = useStylistStore();
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  const getFullImageUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleOutfitTryOn = () => {
    const absoluteHumanUrl = getFullImageUrl(vtonStore.humanImageUrl) || vtonStore.humanImageUrl;
    if (!absoluteHumanUrl) {
      alert("Bạn chưa thiết lập Hồ sơ AI (chưa có ảnh gốc). Vui lòng vào trang Hồ sơ AI để tải ảnh lên.");
      return;
    }

    let garmentsToProcess: {url: string, type: string}[] = [];
    
    option.items.forEach(item => {
      if (item.thumbnail) {
        const absoluteUrl = getFullImageUrl(item.thumbnail);
        if (!absoluteUrl) return;

        let type = item.clothing_type;
        
        // Fallback in case clothing_type is not provided by the backend
        if (!type) {
          const lowerTitle = (item.title || "").toLowerCase();
          type = 'upper_body'; // default
          if (lowerTitle.includes("đầm") || lowerTitle.includes("dress") || (lowerTitle.includes("váy") && !lowerTitle.includes("chân váy"))) {
            type = 'dress';
          } else if (lowerTitle.includes("quần") || lowerTitle.includes("chân váy") || lowerTitle.includes("skirt") || lowerTitle.includes("bottom") || lowerTitle.includes("jeans") || lowerTitle.includes("shorts") || lowerTitle.includes("lower_body")) {
            type = 'lower_body';
          }
        }
        
        if (['upper_body', 'lower_body', 'dress'].includes(type)) {
          garmentsToProcess.push({ url: absoluteUrl, type });
        }
      }
    });

    if (garmentsToProcess.length === 0) {
      alert("Không có trang phục nào phù hợp để thử (hệ thống hiện chỉ hỗ trợ áo, quần, váy).");
      return;
    }

    // Sort to process lower_body first, then upper_body, to layer correctly in VTON pipeline
    // For dress, just put it first
    garmentsToProcess.sort((a, b) => {
        if (a.type === 'dress') return -1;
        if (b.type === 'dress') return 1;
        if (a.type === 'lower_body' && b.type === 'upper_body') return -1;
        if (a.type === 'upper_body' && b.type === 'lower_body') return 1;
        return 0;
    });

    startMultiStepTryOn(absoluteHumanUrl, garmentsToProcess, 'modal');
  };

  const handleAddToCart = (product: OutfitItem) => {
    const variantId = product.variants?.[0]?.id || `mock_variant_${product.id}`;
    const price = 100000; 

    cartStore.addItem({
      id: `cart_${Date.now()}_${product.id}`,
      productId: product.id,
      variantId: variantId,
      title: product.title,
      imageUrl: product.thumbnail,
      quantity: 1,
      unitPrice: price,
      stylistSessionId: 'session_mock' 
    });
  };

  const handleReplaceItem = async (item: OutfitItem) => {
    if (!messageId) return;
    
    setReplacingItemId(item.id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      const contextItems = option.items.map(i => i.id);
      
      const res = await fetch(`${baseUrl}/v1/stylist/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_option_id: option.option_id,
          target_product_id: item.id,
          context_items: contextItems
        }),
      });

      if (!res.ok) throw new Error('Replace request failed');
      
      const data = await res.json();
      const similarItems = data.data;
      
      if (similarItems && similarItems.length > 0) {
        const newItem = similarItems[0];
        replaceItemInMessage(messageId, option.option_id, item.id, newItem);
      } else {
        alert("Không tìm thấy sản phẩm tương tự để thay thế.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi tìm sản phẩm thay thế.");
    } finally {
      setReplacingItemId(null);
    }
  };

  return (
    <div className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 mb-8 group/card hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 overflow-hidden">
      
      {/* Header */}
      <div className="px-7 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 border-b border-zinc-100">
        <h3 className="font-black text-zinc-900 text-xl tracking-tighter">{option.title}</h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-zinc-200/40 rounded-full p-1 border border-zinc-200/50 w-full sm:w-auto justify-center">
            <button 
                onClick={() => vtonStore.setEngine('local')} 
                className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${vtonStore.engine === 'local' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
                Local
            </button>
            <button 
                onClick={() => vtonStore.setEngine('cloud')} 
                className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-1.5 ${vtonStore.engine === 'cloud' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
                FLUX.2
            </button>
          </div>
          <button 
            onClick={handleOutfitTryOn}
            className="w-full sm:w-auto text-[11px] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 font-bold tracking-widest uppercase"
          >
            Thử Đồ Toàn Set
          </button>
        </div>
      </div>
      
      <div className="p-7">
        <p className="text-zinc-500 text-[15px] leading-relaxed mb-8 font-medium italic border-l-4 border-zinc-300 pl-4 bg-zinc-50/50 py-2">
          &quot;{option.reasoning}&quot;
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
          {option.items && option.items.length > 0 ? (
            option.items.map((item: any, idx: number) => {
              const isCloset = item.type === 'closet' || (typeof item === 'string' && !item.startsWith('prod_'));
              const isReplacing = replacingItemId === item.id;
              
              return (
                <div key={item.id || idx} className={`group flex flex-col transition-opacity duration-300 ${isReplacing ? 'opacity-40 scale-95' : 'opacity-100'}`}>
                  <div className="relative aspect-[3/4] w-full bg-zinc-50 rounded-2xl overflow-hidden mb-4 shadow-sm border border-zinc-100 group-hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)] transition-all duration-500">
                    {isCloset && (
                      <span className="absolute top-3 left-3 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg z-10 shadow-md uppercase tracking-wider">
                        Tủ Đồ
                      </span>
                    )}
                    {item.thumbnail ? (
                      <img 
                        src={getFullImageUrl(item.thumbnail)} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium text-zinc-400 bg-zinc-50">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <h4 className="text-[14px] font-bold text-zinc-800 line-clamp-2 leading-snug mb-4 group-hover:text-zinc-600 transition-colors">
                    {item.title}
                  </h4>
                  
                  <div className="mt-auto flex flex-col gap-2">
                    {!isCloset && item.thumbnail && (
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="w-full text-[12px] bg-zinc-100 text-zinc-900 font-bold px-4 py-3 rounded-xl hover:bg-zinc-200 transition-all duration-300"
                      >
                        Thêm vào giỏ
                      </button>
                    )}
                    {messageId && (
                      <button 
                        onClick={() => handleReplaceItem(item)}
                        disabled={isReplacing}
                        className="w-full text-[12px] text-zinc-500 font-bold px-4 py-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:text-zinc-800 hover:bg-zinc-50 transition-all duration-300 shadow-sm"
                      >
                        {isReplacing ? "Đang tìm kiếm..." : "Đổi món khác"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-sm font-medium text-zinc-400 text-center py-8">Không có sản phẩm nào được chọn.</p>
          )}
        </div>
      </div>
    </div>
  );
}
