'use client';

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity } = useCartStore();

  if (!isOpen) return null;

  const totalAmount = items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={toggleCart}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <div className="px-4 py-6 sm:px-6">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-medium text-gray-900">Giỏ hàng của bạn</h2>
                <div className="ml-3 h-7 flex items-center">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={toggleCart}
                  >
                    <span className="sr-only">Đóng trang</span>
                    ✕
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 px-4 sm:px-6">
              {items.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Giỏ hàng trống.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-center object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                        )}
                      </div>

                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3 className="line-clamp-2">{item.title}</h3>
                            <p className="ml-4 whitespace-nowrap">{item.unitPrice.toLocaleString('vi-VN')} ₫</p>
                          </div>
                          {item.stylistSessionId && (
                            <p className="mt-1 text-xs text-blue-500 italic">✨ Gợi ý từ AI Stylist</p>
                          )}
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                  <p>Tổng tiền</p>
                  <p>{totalAmount.toLocaleString('vi-VN')} ₫</p>
                </div>
                <Link 
                  href="/checkout"
                  onClick={toggleCart}
                  className="flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-black hover:bg-gray-800"
                >
                  Thanh toán ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
