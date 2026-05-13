'use client';

import React from 'react';
import { useVTONStore } from '../../../store/useVTONStore';
import { useVTONService } from '../../../hooks/useVTONService';

export default function VTONModal() {
  const store = useVTONStore();
  const { startTryOn, closeSSE } = useVTONService("default_user");

  if (store.status === 'idle' || store.activeContext !== 'modal') return null;

  const handleClose = () => {
    store.reset();
    closeSSE();
  };

  const getStatusText = () => {
    switch (store.status) {
      case 'pending': return "Đang gửi yêu cầu...";
      case 'rendering': return "AI đang vẽ...";
      case 'uploading': return "Đang tải ảnh lên...";
      case 'completed': return "Hoàn tất!";
      case 'error': return "Đã xảy ra lỗi!";
      default: return "";
    }
  };

  // Helper xử lý URL ảnh: Nếu là đường dẫn tương đối (như /uploads/...) thì nối với địa chỉ Backend
  const getFullImageUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Thử Đồ Ảo (VTON)</h2>
        
        <div className="flex flex-col items-center justify-center mb-6">
          <p className="font-semibold text-blue-600 mb-4">{getStatusText()}</p>
          
          {(store.status === 'pending' || store.status === 'rendering' || store.status === 'uploading') && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          )}

          {store.status === 'error' && (
            <div className="text-red-500 text-center mb-4 p-4 bg-red-50 rounded-lg">
              {store.errorMessage}
            </div>
          )}

          {store.status === 'completed' && store.resultImageUrl && (
            <div className="mt-4">
              <img 
                src={getFullImageUrl(store.resultImageUrl)} 
                alt="VTON Result" 
                className="max-h-96 object-contain rounded-md shadow-md"
              />
            </div>
          )}

          {store.status !== 'completed' && store.status !== 'error' && (
            <div className="flex justify-between w-full mt-6 space-x-4">
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-500 mb-2">Ảnh của bạn</p>
                {store.humanImageUrl ? (
                  <img src={getFullImageUrl(store.humanImageUrl)} className="h-32 mx-auto object-cover rounded" alt="Human" />
                ) : (
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">Chưa có ảnh</div>
                )}
              </div>
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-500 mb-2">Trang phục</p>
                {store.garmentImageUrl ? (
                  <img src={getFullImageUrl(store.garmentImageUrl)} className="h-32 mx-auto object-cover rounded" alt="Garment" />
                ) : (
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">Chưa có ảnh</div>
                )}
              </div>
            </div>
          )}
        </div>

        {store.status === 'completed' && (
          <button 
            onClick={handleClose}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
