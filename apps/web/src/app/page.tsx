import Link from 'next/link';
import { ArrowRight, Sparkles, Shirt, User, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans selection:bg-zinc-900 selection:text-white">
      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle background element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-100 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-zinc-800 text-sm font-medium mb-8">
              <Sparkles size={16} />
              <span>Trải nghiệm phòng thử đồ ảo thế hệ mới</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[1.1] mb-8">
              Định hình lại <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500">
                Thế giới Thời trang
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto font-light leading-relaxed mb-12">
              Khám phá Studio Thời trang Ảo. Trò chuyện cùng AI Stylist chuyên nghiệp và ướm thử trang phục lên chính cơ thể bạn chỉ trong chớp mắt.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/ai-stylist"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white font-medium rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:bg-zinc-800 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
              >
                Gặp AI Stylist <ArrowRight size={18} />
              </Link>
              <Link
                href="/wardrobe"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white text-zinc-900 font-medium rounded-full border border-zinc-200 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-300"
              >
                Vào Phòng Thử Đồ
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="py-24 bg-zinc-50 border-t border-zinc-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">Mua sắm không còn là phỏng đoán</h2>
              <p className="text-zinc-600 font-light text-lg">Quy trình 3 bước đơn giản để tìm thấy phong cách hoàn hảo của bạn.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="bg-white p-10 rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:-translate-y-2 transition-transform duration-500">
                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 mb-8">
                  <User size={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-4">1. Hồ sơ Cá nhân hóa</h3>
                <p className="text-zinc-600 leading-relaxed font-light">
                  Chỉ cần chiều cao, cân nặng và một bức ảnh toàn thân. AI sẽ tự động phân tích vóc dáng để chuẩn bị cho việc thử đồ.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-10 rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:-translate-y-2 transition-transform duration-500">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-zinc-900/20">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-4">2. Tư vấn Thông minh</h3>
                <p className="text-zinc-600 leading-relaxed font-light">
                  Trò chuyện tự nhiên như với một Stylist thật. Tìm trang phục đi tiệc, đi biển hay dạo phố chỉ bằng vài dòng tin nhắn.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-10 rounded-[2rem] border border-zinc-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:-translate-y-2 transition-transform duration-500">
                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 mb-8">
                  <Shirt size={24} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-4">3. Thử đồ Virtual Try-On</h3>
                <p className="text-zinc-600 leading-relaxed font-light">
                  Kéo thả trang phục vào người mẫu ảo. Công nghệ AI (CatVTON) sẽ ghép trang phục lên cơ thể bạn một cách chân thực nhất.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900 -z-20"></div>
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
              Bạn đã sẵn sàng nâng cấp phong cách?
            </h2>
            <p className="text-xl text-zinc-400 font-light mb-10">
              Thiết lập hồ sơ AI ngay hôm nay và trải nghiệm không gian mua sắm thời trang đỉnh cao.
            </p>
            <Link
              href="/ai-profile"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-zinc-900 font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform duration-300"
            >
              Tạo Hồ Sơ AI Ngay <Zap size={20} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
