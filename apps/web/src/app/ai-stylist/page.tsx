import ChatBox from '@/components/features/ai-stylist/ChatBox';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Stylist | AI Fashion E-commerce',
  description: 'Trò chuyện với AI Stylist để tìm kiếm và phối đồ hoàn hảo cho bạn.',
};

export default function AIStylistPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Trợ lý Phối đồ Thông minh</h1>
        <p className="text-lg text-gray-600">
          Hãy mô tả phong cách bạn muốn, AI sẽ tìm kiếm trong kho hàng và gợi ý những bộ trang phục phù hợp nhất.
        </p>
      </div>
      
      {/* Khung chat Component */}
      <ChatBox />
    </div>
  );
}
