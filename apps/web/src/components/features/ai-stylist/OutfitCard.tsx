'use client';

import { useEffect, useState } from 'react';
import { OutfitOption } from '@/store/useStylistStore';
import { useVTONStore } from '@/store/useVTONStore';
import { useVTONService } from '@/hooks/useVTONService';

interface Product {
  id: string;
  title: string;
  thumbnail: string | null;
  variants: unknown[];
}

export default function OutfitCard({ option }: { option: OutfitOption }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const vtonStore = useVTONStore();
  const { startTryOn } = useVTONService("default_user");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
        
        // Medusa Store API: we can fetch products by their IDs
        // Build the query string for ?id[]=val1&id[]=val2
        const queryParams = option.items.map(id => `id[]=${id}`).join('&');
        const res = await fetch(`${baseUrl}/store/products?${queryParams}`);
        
        if (res.ok) {
          const data = await res.json();
          // Map fetched products to our local state
          // Handle the case where the API might return products differently
          const fetchedProducts = data.products || [];
          setProducts(fetchedProducts);
        } else {
          console.error("Failed to fetch products for outfit");
        }
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (option.items.length > 0) {
      fetchProducts();
    } else {
      setIsLoading(false);
    }
  }, [option.items]);

  const handleTryOn = (garmentUrl: string | null) => {
    if (!garmentUrl) {
      alert("Sản phẩm này chưa có hình ảnh.");
      return;
    }
    if (!vtonStore.humanImageUrl) {
      alert("Bạn chưa thiết lập Hồ sơ AI (chưa có ảnh gốc). Vui lòng vào trang Hồ sơ AI để tải ảnh lên.");
      return;
    }
    
    startTryOn(vtonStore.humanImageUrl, garmentUrl);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6">
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <h3 className="font-semibold text-blue-900 text-lg">{option.title}</h3>
      </div>
      
      <div className="p-4">
        <p className="text-gray-700 text-sm mb-4 italic">
          &quot;{option.reasoning}&quot;
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.length > 0 ? (
              products.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-lg p-2 flex flex-col items-center hover:shadow-sm transition-shadow">
                  {p.thumbnail ? (
                    <img 
                      src={p.thumbnail} 
                      alt={p.title} 
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2 text-xs text-gray-400">
                      No Image
                    </div>
                  )}
                  <p className="text-xs font-medium text-center line-clamp-2 mb-2">{p.title}</p>
                  <button 
                    onClick={() => handleTryOn(p.thumbnail)}
                    className="mt-auto text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors w-full"
                  >
                    Thử VTON
                  </button>
                </div>
              ))
            ) : (
              // Fallback display if products couldn't be fetched
              option.items.map((id, idx) => (
                <div key={id} className="border border-gray-200 rounded-lg p-2 flex flex-col items-center">
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-md mb-2 text-xs text-gray-400">
                    Product ID: {id.substring(0, 8)}...
                  </div>
                  <p className="text-xs font-medium text-center mb-2">Item {idx + 1}</p>
                  <button 
                    onClick={() => handleTryOn('https://via.placeholder.com/768x1024.png?text=Mock+Garment')}
                    className="mt-auto text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors w-full"
                  >
                    Thử VTON (Mock)
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
