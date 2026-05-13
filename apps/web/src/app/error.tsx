"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route Error caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Oops! Đã có lỗi xảy ra</h2>
        <p className="text-gray-500">
          Không thể tải trang này hoặc tính năng đang gặp sự cố.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={() => reset()}
            className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
