'use client';

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useVTONService } from '@/hooks/useVTONService';
import { useVTONStore } from '@/store/useVTONStore';

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
    // Lấy giá từ variant nếu có, hoặc dùng mock
    const price = product.variants?.[0]?.calculated_price?.calculated_amount || 150000;

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
    <div className="flex flex-col space-y-2 w-full mt-4">
      <button 
        onClick={handleAddToCart}
        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        Thêm vào Giỏ
      </button>
      <button 
        onClick={handleTryOn}
        className="w-full bg-black text-white font-medium py-2 px-4 rounded-md hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        <span>✨</span> Thử đồ ảo (VTON)
      </button>
    </div>
  );
}
