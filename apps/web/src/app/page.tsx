import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white">
      <main>
        {/* Hero section */}
        <div className="relative pt-14 pb-20 lg:pt-24 lg:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block xl:inline">Tương lai của</span>{' '}
              <span className="block text-indigo-600 xl:inline">Thời trang E-commerce</span>
            </h1>
            <p className="mt-4 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-8 md:text-xl md:max-w-3xl">
              Trải nghiệm tư vấn phối đồ thông minh với AI Stylist và ướm thử trang phục ngay lập tức với công nghệ Virtual Try-On tiên tiến nhất.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <Link
                  href="/ai-profile"
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg px-10"
                >
                  1. Thiết lập Hồ sơ AI
                </Link>
                <Link
                  href="/ai-stylist"
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg px-10"
                >
                  2. Chat với AI Stylist
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
          <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
            <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="relative">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                  Thử đồ ảo (Virtual Try-On)
                </h3>
                <p className="mt-3 text-lg text-gray-500">
                  Không còn lo lắng mặc không hợp. Công nghệ AI (CatVTON) giúp bạn "mặc thử" sản phẩm từ cửa hàng lên chính ảnh thật của mình trong nháy mắt. Đảm bảo bạn đưa ra quyết định mua hàng chính xác nhất.
                </p>

                <dl className="mt-10 space-y-10">
                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        1
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Thiết lập vóc dáng</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Cung cấp chiều cao, cân nặng và 1 bức ảnh cơ thể. Hệ thống sẽ tối ưu hóa để ghép đồ chuẩn xác.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        2
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Tìm kiếm với AI</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Chat với AI để tìm kiếm đồ theo hoàn cảnh, phong cách.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        3
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Thêm Giỏ Hàng</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Nếu vừa ý sau khi thử đồ, bạn có thể thêm ngay vào giỏ hàng và thanh toán.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
                {/* Decoration */}
                <div className="bg-gray-200 rounded-xl h-96 w-full flex items-center justify-center border-4 border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium">Bắt đầu bằng việc chọn chức năng trên Menu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
