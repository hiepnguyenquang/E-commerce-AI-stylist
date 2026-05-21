'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, DollarSign, FolderOpen, FileText, Image, Sparkles, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

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

      setMessage({ type: 'success', text: 'Thêm sản phẩm mới và đồng bộ Vector DB thành công!' });
      
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
    <div className="min-h-screen bg-slate-50/50 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center font-sans">
      
      {/* Các quầng sáng màu nền (Glow Orbs) để tạo chiều sâu 3D tối giản */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-zinc-200/40 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-2xl bg-white/75 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-white/60 relative overflow-hidden z-10">
        
        {/* Nút quay về Cửa hàng với micro-interaction nảy nhẹ */}
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors duration-300 mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Quay lại Cửa hàng</span>
        </Link>

        {/* Tiêu đề Avant-Garde Monochrome */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 mb-2 flex items-center justify-center gap-2">
            <Sparkles size={28} className="text-zinc-900 animate-pulse" /> Thêm Sản Phẩm Mới
          </h1>
          <p className="text-zinc-500 font-light text-sm">
            Tạo mới sản phẩm và tự động đồng bộ hóa Vector DB LanceDB ngầm
          </p>
        </div>
        
        {message && (
          <div className={`p-4 mb-8 rounded-2xl flex items-start gap-3 border ${
            message.type === 'success' 
              ? 'bg-green-50/80 border-green-100 text-green-800' 
              : 'bg-red-50/80 border-red-100 text-red-800'
          } backdrop-blur-sm transition-all duration-300`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <span className="font-semibold text-sm leading-relaxed">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Tên sản phẩm */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2">
              <Tag size={16} className="text-zinc-800" />
              <span>Tên sản phẩm *</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-zinc-200/80 bg-white/50 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-zinc-800 font-semibold transition-all duration-300 placeholder-zinc-400"
              placeholder="VD: Áo thun Oversize Basic"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Giá tiền */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2">
                <DollarSign size={16} className="text-zinc-800" />
                <span>Giá bán (VNĐ) *</span>
              </label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full border border-zinc-200/80 bg-white/50 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-zinc-800 font-semibold transition-all duration-300 placeholder-zinc-400"
                placeholder="VD: 250000"
              />
            </div>

            {/* Danh mục */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2">
                <FolderOpen size={16} className="text-zinc-800" />
                <span>Danh mục thời trang</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-zinc-200/80 bg-white/50 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-zinc-800 font-semibold transition-all duration-300 placeholder-zinc-400"
                placeholder="VD: Tops, Pants, Dresses"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-2">
              <FileText size={16} className="text-zinc-800" />
              <span>Mô tả chi tiết sản phẩm</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-zinc-200/80 bg-white/50 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-zinc-800 font-medium transition-all duration-300 placeholder-zinc-400 leading-relaxed"
              placeholder="Chất liệu cotton co giãn, phong cách năng động đi chơi..."
            />
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 mb-3">
              <Image size={16} className="text-zinc-800" />
              <span>Hình ảnh đại diện sản phẩm</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
              <div className="flex-shrink-0 h-40 w-32 bg-white rounded-2xl border-2 border-dashed border-zinc-200 overflow-hidden flex items-center justify-center relative shadow-inner">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-zinc-400 text-xs text-center px-2 font-light">Chưa có ảnh</span>
                )}
              </div>
              <div className="w-full">
                <input
                  type="file"
                  id="product-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label 
                  htmlFor="product-image"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-bold shadow-sm hover:border-zinc-300 transition-all duration-300 cursor-pointer active:scale-95"
                >
                  Chọn ảnh từ máy tính
                </label>
                <p className="text-xs text-zinc-400 font-light mt-2.5 leading-relaxed">
                  Hỗ trợ định dạng JPG, PNG. Ảnh nên rõ ràng, đầy đủ ánh sáng để VTON đạt hiệu quả cao nhất.
                </p>
              </div>
            </div>
          </div>

          {/* Nút Tạo sản phẩm */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl text-white font-extrabold text-lg bg-zinc-950 hover:bg-zinc-850 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-zinc-950/10"
            >
              {loading ? (
                <span>Đang xử lý tạo & đồng bộ...</span>
              ) : (
                <>
                  <Sparkles size={20} className="animate-pulse" />
                  <span>Tạo Sản Phẩm & Đồng Bộ AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
