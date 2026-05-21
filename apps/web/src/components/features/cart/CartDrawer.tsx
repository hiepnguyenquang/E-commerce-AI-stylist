'use client';

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity } = useCartStore();

  if (!isOpen) return null;

  const totalAmount = items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop overlay mờ mịn */}
      <div 
        className="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm transition-opacity duration-500 ease-out" 
        onClick={toggleCart}
      />
      
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md transform transition-all duration-500 ease-in-out">
          {/* Card Kính mờ Glassmorphism của Giỏ hàng */}
          <div className="h-full flex flex-col bg-white/90 backdrop-blur-2xl border-l border-zinc-100 shadow-2xl overflow-hidden relative">
            
            {/* Header giỏ hàng */}
            <div className="px-6 py-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-zinc-900" />
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">Giỏ hàng của bạn</h2>
                {items.length > 0 && (
                  <span className="bg-zinc-100 text-zinc-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-zinc-200">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-900 p-2 hover:bg-zinc-100/80 rounded-full transition-all duration-300"
                onClick={toggleCart}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Danh sách sản phẩm */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-zinc-200">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-zinc-400">
                  <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-300">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="font-bold text-zinc-800 mb-1 text-sm">Giỏ hàng đang trống</h3>
                  <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed">
                    Hãy dạo quanh cửa hàng và chọn những bộ đồ ưng ý nhất nhé!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl p-4 transition-all duration-300 border border-zinc-100/50 flex gap-4 hover:shadow-[0_4px_15px_rgba(0,0,0,0.01)] group"
                    >
                      {/* Ảnh trang phục - Sử dụng object-contain tránh bị cắt xén */}
                      <div className="flex-shrink-0 w-20 h-24 bg-white border border-zinc-100/80 rounded-xl overflow-hidden p-1 flex items-center justify-center relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 bg-zinc-50 font-medium">No Img</div>
                        )}
                      </div>

                      {/* Thông tin chi tiết */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-sm text-zinc-900 tracking-tight leading-snug line-clamp-2 group-hover:text-zinc-950 transition-colors">
                              {item.title}
                            </h3>
                          </div>
                          {item.stylistSessionId && (
                            <p className="mt-1 text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              <span>Gợi ý từ AI Stylist</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          {/* Bộ tăng giảm số lượng */}
                          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200/30">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-white rounded-md transition-all active:scale-90"
                              aria-label="Giảm số lượng"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2.5 text-xs font-extrabold text-zinc-800 select-none">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-white rounded-md transition-all active:scale-90"
                              aria-label="Tăng số lượng"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-black text-sm text-zinc-900 whitespace-nowrap">
                              {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} ₫
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-300"
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer tổng tiền và thanh toán */}
            {items.length > 0 && (
              <div className="border-t border-zinc-100 bg-white/95 px-6 py-6 sm:px-8 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-zinc-500 font-bold text-sm uppercase tracking-wider">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-zinc-950 tracking-tight">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <Link 
                  href="/checkout"
                  onClick={toggleCart}
                  className="w-full py-4 px-6 rounded-xl bg-zinc-950 text-white font-extrabold text-base hover:bg-zinc-850 hover:shadow-[0_8px_25px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/10 cursor-pointer group/btn"
                >
                  <span>Thanh toán ngay</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
