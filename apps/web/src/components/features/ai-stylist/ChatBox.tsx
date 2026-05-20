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
      
      let assistantMessage: Message;
      if (data.data.refusal) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message,
        };
      } else {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Tôi đã tìm thấy ${data.data.options?.length || 0} gợi ý tuyệt vời dành riêng cho bạn:`,
          options: data.data.options,
        };
      }

      addMessage(assistantMessage);
      fetchSessions();
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
    
    const assistantMessage: Message = {
      id: `ast_${session.id}`,
      role: 'assistant',
      content: `Trong phiên này, AI đã gợi ý: ${session.reasoning || "Không có dữ liệu"}`,
    };
    addMessage(assistantMessage);
    setIsSidebarOpen(false);
  };

  return (
    <>
      <div className="relative flex flex-row h-full w-full mx-auto bg-white/70 backdrop-blur-2xl rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        
        {/* Clean Background inside ChatBox */}
        <div className="absolute inset-0 bg-zinc-50/30 z-0 pointer-events-none"></div>

        {/* Sidebar Lịch sử */}
        <div className={`absolute inset-y-0 left-0 w-72 bg-white/90 backdrop-blur-2xl border-r border-white z-30 transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[10px_0_30px_rgba(0,0,0,0.03)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-between items-center p-6 border-b border-zinc-100">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2 tracking-tight">
              <History size={18} className="text-zinc-500" /> Lịch sử Chat
            </h3>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 rounded-full transition-all">
              <X size={16} />
            </button>
          </div>
          <div className="p-5 overflow-y-auto h-[calc(100%-80px)] space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center mt-8 font-medium">Chưa có lịch sử nào.</p>
            ) : (
              sessions.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => loadSession(s)}
                  className="p-4 bg-white rounded-2xl cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-zinc-100 hover:border-zinc-300 transition-all duration-300"
                >
                  <p className="text-[13px] font-semibold text-zinc-800 line-clamp-2 leading-relaxed">{s.prompt}</p>
                  <p className="text-[10px] font-bold text-zinc-400 mt-2 tracking-widest uppercase">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vùng Chat Chính */}
        <div className="flex flex-col flex-1 w-full relative z-10">
          {/* Header */}
          <div className="absolute top-0 w-full bg-white/70 backdrop-blur-xl px-8 py-5 border-b border-zinc-100/50 flex justify-between items-center z-20 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="bg-zinc-900 p-2.5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-zinc-900 text-2xl tracking-tighter">AI Stylist</h2>
                <p className="text-[11px] text-zinc-600 font-light uppercase tracking-widest mt-0.5">Trợ lý Cá nhân</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-xs text-zinc-700 bg-white/80 backdrop-blur-md hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all px-4 py-2.5 border border-zinc-200 rounded-full flex items-center gap-2 font-bold tracking-wide"
              >
                <History size={14} className="text-zinc-500" /> Lịch sử
              </button>
              <button 
                onClick={clearChat}
                className="text-xs text-zinc-700 bg-white/80 backdrop-blur-md hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all px-4 py-2.5 border border-zinc-200 rounded-full font-bold tracking-wide"
              >
                Làm mới
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-8 pt-32 pb-8 space-y-8 scroll-smooth">
            {messages.length === 0 && !isTyping && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-zinc-200">
                  <Sparkles className="w-10 h-10 text-zinc-400" />
                </div>
                <h3 className="text-3xl font-black text-zinc-800 tracking-tighter mb-3">Sẵn sàng tỏa sáng?</h3>
                <p className="text-[15px] text-zinc-600 font-light max-w-sm leading-relaxed">Mô tả phong cách, sự kiện hoặc món đồ bạn mong muốn. AI Stylist sẽ mang đến những set đồ hoàn hảo nhất.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role !== 'user' && (
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 text-white mr-4 shadow-lg shadow-black/10">
                      <Bot size={20} />
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <div className={`px-6 py-4 rounded-3xl ${
                      msg.role === 'user' 
                        ? 'bg-zinc-900 text-white rounded-tr-none shadow-[0_10px_25px_rgba(0,0,0,0.1)]' 
                        : 'bg-white text-zinc-800 border border-zinc-100 rounded-tl-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]'
                    }`}>
                      <p className={`text-[15px] leading-relaxed ${msg.role === 'user' ? 'font-medium' : 'font-semibold text-zinc-700'}`}>{msg.content}</p>
                    </div>
                    
                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-8 space-y-8">
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
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex flex-row max-w-[85%]">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 text-white mr-4 shadow-lg shadow-black/10">
                    <Bot size={20} />
                  </div>
                  <div className="bg-white border border-zinc-100 px-6 py-5 rounded-3xl rounded-tl-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] flex space-x-2.5 items-center">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/80 backdrop-blur-2xl px-8 py-6 border-t border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-20 relative">
            <div className="relative flex items-center group">
              <input
                type="text"
                className="relative w-full pl-8 pr-16 py-5 bg-zinc-50 border border-zinc-200 shadow-inner rounded-full focus:bg-white focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 outline-none transition-all text-zinc-900 font-medium text-[15px] placeholder:text-zinc-400"
                placeholder="Gợi ý trang phục đi tiệc cưới phong cách vintage..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                className={`absolute right-3 p-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  inputValue.trim() && !isTyping 
                    ? 'bg-zinc-900 text-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:scale-110 hover:-rotate-12' 
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed scale-95'
                }`}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
              >
                <SendIcon size={18} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

