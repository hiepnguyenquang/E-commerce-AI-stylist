"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-3xl font-extrabold text-red-600">Đã xảy ra lỗi hệ thống nghiêm trọng</h2>
            <p className="mt-2 text-sm text-gray-500">
              Rất xin lỗi vì sự bất tiện này. Chúng tôi đã ghi nhận lỗi và sẽ khắc phục sớm nhất.
            </p>
            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={() => reset()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Thử lại
              </button>
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
