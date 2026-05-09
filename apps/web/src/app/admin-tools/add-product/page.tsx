'use client';

import React, { useState } from 'react';

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('price', formData.price);
      if (formData.category) {
        form.append('category', formData.category);
      }
      if (imageFile) {
        form.append('image', imageFile);
      }

      // TODO: Change 'your_super_secret_internal_key_here' to the actual internal secret in your env
      const internalToken = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || 'your_super_secret_internal_key_here';

      const res = await fetch(`${baseUrl}/v1/internal/products`, {
        method: 'POST',
        headers: {
          'x-internal-token': internalToken
        },
        body: form
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || 'Lỗi khi tạo sản phẩm');
      }

      setMessage({ type: 'success', text: 'Thêm sản phẩm thành công!' });
      
      // Reset form
      setFormData({ title: '', description: '', price: '', category: '' });
      setImageFile(null);
      setImagePreview(null);
      
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Thêm Sản phẩm Mới</h1>
        
        {message && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              placeholder="VD: Áo phông Basic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VNĐ) *</label>
            <input
              type="number"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              placeholder="VD: 150000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              placeholder="VD: Shirts"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
              placeholder="Mô tả chi tiết sản phẩm..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 h-32 w-24 bg-gray-100 border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium text-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Tạo Sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
