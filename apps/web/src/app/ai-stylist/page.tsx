import ChatBox from '@/components/features/ai-stylist/ChatBox';
import VTONModal from '@/components/features/ai-stylist/VTONModal';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Stylist | AI Fashion E-commerce',
  description: 'Trò chuyện với AI Stylist để tìm kiếm và phối đồ hoàn hảo cho bạn.',
};

export default function AIStylistPage() {
  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-zinc-50/50 flex flex-col items-center p-4 sm:p-6 font-sans">
      {/* Khung chat Component */}
      <div className="w-full flex-1 min-h-0">
        <ChatBox />
      </div>
      
      {/* Popup Thử đồ ảo */}
      <VTONModal />
    </div>
  );
}
