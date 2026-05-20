'use client';

import React, { useEffect, useState } from 'react';
import { useVTONStore } from '../../../store/useVTONStore';
import { useVTONService } from '../../../hooks/useVTONService';
import { X, Sparkles, AlertCircle, Save } from 'lucide-react';

export default function VTONModal() {
  const store = useVTONStore();
  const { closeSSE } = useVTONService("default_user");
  const [mounted, setMounted] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);

  // Smooth entrance transition handling
  useEffect(() => {
    if (store.status !== 'idle' && store.activeContext === 'modal') {
      // Small delay to ensure display:block is painted before opacity transition
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [store.status, store.activeContext]);

  if (store.status === 'idle' || store.activeContext !== 'modal') return null;

  const handleClose = () => {
    setMounted(false);
    setTimeout(() => {
      store.reset();
      closeSSE();
    }, 300); // match transition duration
  };

  const handleSaveResult = async () => {
    if (!store.resultImageUrl) return;
    setIsSavingResult(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      const res = await fetch(`${baseUrl}/v1/user/garments/vton-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: store.resultImageUrl,
          selectedOutfit: store.selectedOutfit
        })
      });
      if (res.ok) {
        alert("Đã lưu kết quả vào bộ sưu tập Outfit!");
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi khi lưu kết quả.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu kết quả.");
    } finally {
      setIsSavingResult(false);
    }
  };

  const getStatusText = () => {
    switch (store.status) {
      case 'pending': return "Đang khởi tạo...";
      case 'rendering': return "AI đang xử lý hình ảnh...";
      case 'uploading': return "Đang chuẩn bị dữ liệu...";
      case 'processing_next_step': return "Đang xử lý bước tiếp theo...";
      case 'completed': return "Hoàn tất";
      case 'error': return "Đã xảy ra lỗi";
      default: return "";
    }
  };

  const getFullImageUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isProcessing = ['pending', 'rendering', 'uploading', 'processing_next_step'].includes(store.status);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-[420px] p-8 relative flex flex-col items-center transition-all duration-300 transform ${mounted ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2.5 text-zinc-400 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-all duration-200"
          aria-label="Đóng"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-zinc-400" />
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Thử Đồ Ảo</h2>
        </div>

        <div className="w-full flex flex-col items-center mt-4">
          
          {/* Loading State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-zinc-900 rounded-full border-t-transparent animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-zinc-300 animate-pulse" />
              </div>
              <p className="font-semibold text-zinc-800 text-[15px] mb-1">{store.progressMessage || getStatusText()}</p>
              <p className="text-xs text-zinc-500 font-medium tracking-wide">Vui lòng chờ trong giây lát...</p>
            </div>
          )}

          {/* Error State */}
          {store.status === 'error' && (
            <div className="w-full flex flex-col items-center py-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-bold text-zinc-900 mb-2">Không thể thử đồ</p>
              <p className="text-sm text-zinc-600 text-center mb-6 px-4">{store.errorMessage}</p>
              <button 
                onClick={handleClose}
                className="w-full py-3.5 bg-zinc-100 text-zinc-700 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-colors"
              >
                Đóng lại
              </button>
            </div>
          )}

          {/* Completed State */}
          {store.status === 'completed' && store.resultImageUrl && (
            <div className="w-full flex flex-col items-center mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-full bg-zinc-50 rounded-2xl p-2 border border-zinc-100 shadow-inner mb-6">
                <img 
                  src={getFullImageUrl(store.resultImageUrl)} 
                  alt="Kết quả thử đồ ảo" 
                  className="w-full h-auto max-h-[50vh] object-contain rounded-xl drop-shadow-md"
                />
              </div>
              <div className="w-full flex gap-3">
                <button 
                  onClick={handleSaveResult}
                  disabled={isSavingResult}
                  className="flex-1 py-3.5 flex justify-center items-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-widest rounded-full hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 transition-all shadow-sm"
                >
                  <Save size={14} />
                  {isSavingResult ? "Đang lưu..." : "Lưu ảnh"}
                </button>
                <button 
                  onClick={handleClose}
                  className="flex-1 py-3.5 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-md hover:bg-zinc-800 hover:-translate-y-0.5 transition-all"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
