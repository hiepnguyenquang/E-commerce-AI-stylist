'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalAmount = items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setStatus('processing');
    setErrorMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      
      const response = await fetch(`${baseUrl}/api/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_id: `cart_${Date.now()}`, // MVP Mock cart ID
          payment_method: 'mock_card' // Hoặc 'fail' nếu muốn test rollback
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Thanh toán thất bại');
      }

      setStatus('success');
      clearCart();

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  const handleFailCheckout = async () => {
    if (items.length === 0) return;

    setStatus('processing');
    setErrorMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      
      const response = await fetch(`${baseUrl}/api/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_id: `cart_${Date.now()}`,
          payment_method: 'fail' // Cố ý gây lỗi để test Saga Rollback
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Thanh toán thất bại');
      }

      setStatus('success');
      clearCart();

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
          <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đang được xử lý.</p>
          <Link href="/" className="text-white bg-black hover:bg-gray-800 font-medium rounded-md px-4 py-2 transition-colors">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Thanh toán</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Chi tiết đơn hàng</h3>
          </div>
          <ul className="divide-y divide-gray-200 px-4 sm:px-6">
            {items.length === 0 ? (
              <li className="py-4 text-center text-gray-500">Giỏ hàng trống</li>
            ) : (
              items.map((item) => (
                <li key={item.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded object-cover mr-4" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center mr-4 text-xs text-gray-400">No Img</div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} ₫
                  </p>
                </li>
              ))
            )}
          </ul>
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Tổng cộng</span>
            <span className="text-xl font-bold text-gray-900">{totalAmount.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        {status === 'error' && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={items.length === 0 || status === 'processing'}
              className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
            >
              {status === 'processing' ? 'Đang xử lý...' : 'Hoàn tất Thanh toán'}
            </button>
            <button
              type="button"
              onClick={handleFailCheckout}
              disabled={items.length === 0 || status === 'processing'}
              className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
            >
              Giả lập Lỗi (Test Saga)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
