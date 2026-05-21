'use client';

import React, { useState, useMemo } from 'react';
import ProductActionButtons from './ProductActionButtons';

interface ProductGridProps {
  initialProducts: any[];
}

export default function ProductGrid({ initialProducts }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts];

    // Lọc theo từ khóa
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(lowerSearch) ||
          p.description?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      const priceA = a.variants?.[0]?.calculated_price?.calculated_amount || a.variants?.[0]?.prices?.[0]?.amount || 0;
      const priceB = b.variants?.[0]?.calculated_price?.calculated_amount || b.variants?.[0]?.prices?.[0]?.amount || 0;

      if (sortOption === 'price_asc') {
        return priceA - priceB;
      }
      if (sortOption === 'price_desc') {
        return priceB - priceA;
      }
      if (sortOption === 'name_asc') {
        return a.title?.localeCompare(b.title);
      }
      // default: newest, but since we don't have created_at reliable, let's just keep as is
      return 0;
    });

    return result;
  }, [initialProducts, searchTerm, sortOption]);

  if (initialProducts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có sản phẩm</h3>
        <p className="mt-1 text-sm text-gray-500">Chưa có sản phẩm nào được đăng bán.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Bộ lọc và Sắp xếp */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-white/50">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full border border-zinc-200/80 rounded-xl px-4 py-2.5 bg-white/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all duration-300 text-gray-900 font-medium placeholder-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto flex items-center gap-3">
          <label htmlFor="sort" className="text-sm font-semibold text-zinc-700 whitespace-nowrap">
            Sắp xếp:
          </label>
          <select
            id="sort"
            className="border border-zinc-200/80 rounded-xl px-4 py-2.5 bg-white/50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all duration-300 cursor-pointer text-zinc-800 font-medium"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="name_asc">Tên: A-Z</option>
          </select>
        </div>
      </div>

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 bg-white/50 backdrop-blur-sm rounded-2xl border border-zinc-100">Không tìm thấy sản phẩm phù hợp.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredAndSortedProducts.map((product: any) => (
            <div 
              key={product.id} 
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-white/50 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col group"
            >
              {/* Thẻ chứa ảnh - Sử dụng object-contain và padding để giữ nguyên hình ảnh, không bị cắt xén */}
              <div className="w-full h-80 bg-slate-50/50 flex items-center justify-center overflow-hidden p-4 relative border-b border-zinc-100/50">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50">
                    Chưa có ảnh
                  </div>
                )}
                
                {/* Badge AI Try-On tối giản sang trọng */}
                <div className="absolute top-3 right-3 bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center gap-1.5 z-10 transition-transform duration-300 group-hover:scale-105">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span>AI VTON</span>
                </div>

                {/* Glow nhẹ phía sau ảnh khi hover - Monochrome */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight line-clamp-1 mb-1.5 group-hover:text-zinc-950 transition-colors duration-300">
                  {product.title}
                </h3>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-grow font-light leading-relaxed">
                  {product.description || 'Chưa có mô tả chi tiết.'}
                </p>
                
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-lg font-extrabold text-zinc-900 tracking-tight">
                    {/* Hỗ trợ lấy giá từ nhiều cấu trúc (Medusa thay đổi JSON) */}
                    {(product.variants?.[0]?.calculated_price?.calculated_amount || product.variants?.[0]?.prices?.[0]?.amount)
                      ? `${(product.variants?.[0]?.calculated_price?.calculated_amount || product.variants[0].prices[0].amount).toLocaleString('vi-VN')} ₫` 
                      : 'Liên hệ'}
                  </span>
                </div>

                {/* Tích hợp component Client để xử lý action với phong cách Bolder & Delightful */}
                <ProductActionButtons product={product} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
