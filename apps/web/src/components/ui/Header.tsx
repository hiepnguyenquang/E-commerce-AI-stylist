'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Sparkles, ShoppingBag } from 'lucide-react';

export default function Header() {
  const { items, toggleCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Cửa hàng', path: '/products' },
    { name: 'AI Stylist', path: '/ai-stylist' },
    { name: 'Hồ sơ AI', path: '/ai-profile' },
    { name: 'Tủ đồ', path: '/wardrobe' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] sticky top-0 z-50 border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="bg-zinc-900 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <Link href="/" className="text-2xl font-black tracking-tighter text-zinc-900">
              AIFashion
            </Link>
          </div>

          <div className="hidden md:flex md:space-x-1 items-center bg-zinc-50 p-1.5 rounded-full border border-zinc-100">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleCart}
              className="relative p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-colors focus:outline-none flex items-center justify-center gap-2"
            >
              <span className="sr-only">Mở giỏ hàng</span>
              <ShoppingBag size={22} strokeWidth={1.5} />
              {mounted && itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-zinc-900 rounded-full border-2 border-white shadow-sm">
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
