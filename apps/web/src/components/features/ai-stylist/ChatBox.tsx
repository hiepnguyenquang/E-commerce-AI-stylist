'use client';

import { useState, useRef, useEffect } from 'react';
import { useStylistStore, Message } from '@/store/useStylistStore';
import OutfitCard from './OutfitCard';
import { SendIcon, User, Bot, Sparkles, History, X } from 'lucide-react';

export default function ChatBox() {
  const { messages, isTyping, addMessage, setTyping, clearChat } = useStylistStore();
  const [inputValue, setInputValue] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchSessions = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      const res = await fetch(`${baseUrl}/v1/stylist/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    addMessage(userMessage);
    setInputValue('');
    setTyping(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
      const res = await fetch(`${baseUrl}/v1/stylist/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_text: userMessage.content,
          limit_options: 2,
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Tôi đã tìm thấy ${data.data.options?.length || 0} gợi ý phối đồ dành cho bạn:`,
        options: data.data.options,
      };

      addMessage(assistantMessage);
      fetchSessions(); // Làm mới lịch sử sau khi chat
    } catch (error) {
      console.error('Error fetching stylist suggestions:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, hệ thống AI Stylist đang gặp sự cố hoặc quá tải. Vui lòng thử lại sau.',
      };
      addMessage(errorMessage);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const loadSession = (session: any) => {
    clearChat();
    const userMessage: Message = {
      id: `user_${session.id}`,
      role: 'user',
      content: session.prompt,
    };
    addMessage(userMessage);
    
    // Lưu ý: Hiện tại API /sessions chưa join session_items (do db design phức tạp MVP).
    // Tạm thời ở mức hiển thị lịch sử prompt đã hỏi để gợi nhớ.
    const assistantMessage: Message = {
      id: `ast_${session.id}`,
      role: 'assistant',
      content: `Trong phiên này, AI đã gợi ý: ${session.reasoning || "Không có dữ liệu"}`,
    };
    addMessage(assistantMessage);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-row h-[600px] w-full max-w-5xl mx-auto bg-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
      
      {/* Sidebar Lịch sử */}
      <div className={`absolute inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <History size={18} /> Lịch sử Chat
          </h3>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-red-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto h-[calc(100%-60px)]">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">Chưa có lịch sử.</p>
          ) : (
            sessions.map((s) => (
              <div 
                key={s.id} 
                onClick={() => loadSession(s)}
                className="p-3 mb-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{s.prompt}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vùng Chat Chính */}
      <div className="flex flex-col flex-1 w-full">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">AI Stylist</h2>
              <p className="text-xs text-gray-500">Sẵn sàng tư vấn trang phục cho bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1 border border-gray-300 rounded hover:bg-indigo-50 flex items-center gap-1"
            >
              <History size={16} /> Lịch sử
            </button>
            <button 
              onClick={clearChat}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              Làm mới (Clear)
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${
                  msg.role === 'user' ? 'bg-blue-600 text-white ml-3' : 'bg-gray-200 text-gray-700 mr-3'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                
                <div className="flex flex-col">
                  <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}>
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                  
                  {/* Hiển thị Outfit Options nếu có */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {msg.options.map((opt, idx) => (
                        <OutfitCard key={idx} option={opt} messageId={msg.id} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex flex-row max-w-[85%]">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 mr-3">
                  <Bot size={20} />
                </div>
                <div className="bg-white border border-gray-200 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="relative flex items-center">
            <input
              type="text"
              className="w-full pl-5 pr-14 py-4 bg-gray-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
              placeholder="Nhập yêu cầu phối đồ (VD: đồ đi tiệc, phong cách vintage...)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button
              className={`absolute right-2 p-2 rounded-full flex items-center justify-center transition-colors ${
                inputValue.trim() && !isTyping ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
            >
              <SendIcon size={18} className="ml-1" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI Stylist có thể mất vài giây để phân tích và tìm kiếm sản phẩm phù hợp.
          </p>
        </div>
      </div>
    </div>
  );
}
