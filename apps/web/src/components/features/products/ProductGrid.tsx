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
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Sắp xếp:
          </label>
          <select
            id="sort"
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
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
        <div className="text-center py-10 text-gray-500">Không tìm thấy sản phẩm phù hợp.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredAndSortedProducts.map((product: any) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-w-3 aspect-h-4 bg-gray-200 relative group overflow-hidden">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-400 bg-gray-100">
                    No Image
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">{product.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-grow">{product.description || 'Chưa có mô tả.'}</p>
                
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-lg font-bold text-indigo-600">
                    {/* Hỗ trợ lấy giá từ nhiều cấu trúc (Medusa thay đổi JSON) */}
                    {(product.variants?.[0]?.calculated_price?.calculated_amount || product.variants?.[0]?.prices?.[0]?.amount)
                      ? `${(product.variants?.[0]?.calculated_price?.calculated_amount || product.variants[0].prices[0].amount).toLocaleString('vi-VN')} ₫` 
                      : 'Liên hệ'}
                  </span>
                </div>

                {/* Tích hợp component Client để xử lý action */}
                <ProductActionButtons product={product} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
