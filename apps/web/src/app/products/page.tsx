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
    
    // Fetch directly from Medusa Store API with prices fields
    const res = await fetch(`${baseUrl}/store/products?fields=*variants.prices`, { 
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
    <div className="bg-zinc-50/50 min-h-[calc(100vh-80px)] pt-6 pb-12 font-sans">
      <div className="w-full px-4 sm:px-8">
        <ProductGrid initialProducts={products} />
      </div>

      {/* Tái sử dụng Popup VTON */}
      <VTONModal />
    </div>
  );
}
