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
    if (!vtonStore.humanImageUrl) {
      alert("Bạn chưa thiết lập Hồ sơ AI (chưa có ảnh gốc). Vui lòng vào trang Hồ sơ AI để tải ảnh lên.");
      return;
    }

    const garmentsToProcess: {url: string, type: string}[] = [];
    
    option.items.forEach(item => {
      if (item.thumbnail) {
        const absoluteUrl = getFullImageUrl(item.thumbnail);
        if (!absoluteUrl) return;

        const lowerTitle = (item.title || "").toLowerCase();
        let type = 'upper_body'; // default
        
        if (lowerTitle.includes("váy") || lowerTitle.includes("đầm") || lowerTitle.includes("dress")) {
          type = 'dress';
        } else if (lowerTitle.includes("quần") || lowerTitle.includes("chân váy") || lowerTitle.includes("skirt") || lowerTitle.includes("bottom") || lowerTitle.includes("jeans") || lowerTitle.includes("shorts")) {
          type = 'lower_body';
        }
        
        garmentsToProcess.push({ url: absoluteUrl, type });
      }
    });

    if (garmentsToProcess.length === 0) {
      alert("Không có hình ảnh trang phục nào để thử.");
      return;
    }

    const absoluteHumanUrl = getFullImageUrl(vtonStore.humanImageUrl) || vtonStore.humanImageUrl;
    startMultiStepTryOn(absoluteHumanUrl, garmentsToProcess);
    // VTONModal now uses activeContext='modal'. By default startMultiStepTryOn sets 'wardrobe',
    // wait, we just updated it to accept context. We should pass 'modal'.
    // Let's fix that below.
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
        <h3 className="font-semibold text-blue-900 text-lg">{option.title}</h3>
        <button 
          onClick={() => {
            const absoluteHumanUrl = getFullImageUrl(vtonStore.humanImageUrl) || vtonStore.humanImageUrl;
            if (!absoluteHumanUrl) {
                alert("Bạn chưa thiết lập Hồ sơ AI (chưa có ảnh gốc).");
                return;
            }
            const garmentsToProcess: {url: string, type: string}[] = [];
            option.items.forEach(item => {
                if (item.thumbnail) {
                    const absoluteUrl = getFullImageUrl(item.thumbnail);
                    if (!absoluteUrl) return;
                    const lowerTitle = (item.title || "").toLowerCase();
                    let type = 'upper_body';
                    if (lowerTitle.includes("váy") || lowerTitle.includes("đầm") || lowerTitle.includes("dress")) {
                        type = 'dress';
                    } else if (lowerTitle.includes("quần") || lowerTitle.includes("chân váy") || lowerTitle.includes("skirt") || lowerTitle.includes("bottom") || lowerTitle.includes("jeans") || lowerTitle.includes("shorts")) {
                        type = 'lower_body';
                    }
                    garmentsToProcess.push({ url: absoluteUrl, type });
                }
            });
            if (garmentsToProcess.length === 0) {
                alert("Không có hình ảnh trang phục nào để thử.");
                return;
            }
            startMultiStepTryOn(absoluteHumanUrl, garmentsToProcess, 'modal');
          }}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          Thử Đồ (Toàn Set)
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-gray-700 text-sm mb-4 italic">
          &quot;{option.reasoning}&quot;
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {option.items && option.items.length > 0 ? (
            option.items.map((item: any, idx: number) => {
              const isCloset = item.type === 'closet' || (typeof item === 'string' && !item.startsWith('prod_'));
              const isReplacing = replacingItemId === item.id;
              
              return (
                <div key={item.id || idx} className={`border ${isCloset ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'} rounded-lg p-2 flex flex-col items-center hover:shadow-sm transition-shadow relative ${isReplacing ? 'opacity-50' : ''}`}>
                  {isCloset && (
                    <span className="absolute top-0 left-0 bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-1 rounded-br-lg rounded-tl-lg z-10">TỦ ĐỒ</span>
                  )}
                  {item.thumbnail ? (
                    <img 
                      src={getFullImageUrl(item.thumbnail)} 
                      alt={item.title} 
                      className="w-full h-32 object-cover rounded-md mb-2 mt-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2 text-xs text-gray-400 text-center px-2 mt-2">
                      No Image
                    </div>
                  )}
                  <p className="text-xs font-medium text-center line-clamp-2 mb-2 h-8">{item.title}</p>
                  
                  <div className="w-full flex flex-col space-y-1 mt-auto">
                    <div className="flex space-x-1">
                      {!isCloset && item.thumbnail && (
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 text-[10px] bg-blue-600 text-white px-1 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Mua
                        </button>
                      )}
                    </div>
                    {messageId && (
                      <button 
                        onClick={() => handleReplaceItem(item)}
                        disabled={isReplacing}
                        className="w-full text-[10px] border border-gray-300 text-gray-600 px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isReplacing ? "Đang tìm..." : "Đổi món này"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-gray-500 text-center py-4">Không có sản phẩm nào được chọn.</p>
          )}
        </div>
      </div>
    </div>
  );
}
