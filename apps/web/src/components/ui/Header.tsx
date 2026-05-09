'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const { items, toggleCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AI Fashion
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/products" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Cửa hàng
              </Link>
              <Link href="/ai-stylist" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                AI Stylist
              </Link>
              <Link href="/ai-profile" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Hồ sơ AI
              </Link>
              <Link href="/wardrobe" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Tủ đồ
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <span className="sr-only">Mở giỏ hàng</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {mounted && itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
