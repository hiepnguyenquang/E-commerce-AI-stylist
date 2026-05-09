import React from 'react';
import ProductGrid from '@/components/features/products/ProductGrid';
import VTONModal from '@/components/features/ai-stylist/VTONModal';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cửa hàng | AI Fashion E-commerce',
  description: 'Khám phá tất cả sản phẩm thời trang.',
};

async function getProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';
    
    // Fetch directly from Medusa Store API
    const res = await fetch(`${baseUrl}/store/products`, { 
      headers: {
        'x-publishable-api-key': publishableKey
      },
      next: { revalidate: 60 } 
    });
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return { products: [] };
  }
}

export default async function ProductsPage() {
  const data = await getProducts();
  const products = data.products || [];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Cửa hàng Thời trang</h1>
          <p className="text-lg text-gray-600">Khám phá và thử trực tiếp bằng công nghệ AI.</p>
        </div>

        <ProductGrid initialProducts={products} />
      </div>

      {/* Tái sử dụng Popup VTON */}
      <VTONModal />
    </div>
  );
}
