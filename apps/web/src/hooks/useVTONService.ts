import { useEffect, useRef } from 'react';
import { useVTONStore } from '../store/useVTONStore';

export function useVTONService(userId: string = "default_user") {
  const store = useVTONStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      closeSSE();
    };
  }, []);

  const closeSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const startTryOn = async (humanImageUrl: string, garmentImageUrl: string) => {
    if (!humanImageUrl || !garmentImageUrl) {
      store.setVTONError("Thiếu ảnh người mẫu hoặc trang phục.");
      return;
    }

    try {
      // 1. Update State
      store.startVTON(humanImageUrl, garmentImageUrl);

      // 2. Initialize SSE BEFORE calling the API to ensure we don't miss any fast events
      closeSSE(); // Close any existing connection
      const sseUrl = `http://localhost:9000/v1/stream/vision-results?user_id=${userId}`;
      eventSourceRef.current = new EventSource(sseUrl);

      eventSourceRef.current.onmessage = (event) => {
        // Ignored un-named events
      };

      eventSourceRef.current.addEventListener('vision_complete', (event) => {
        try {
          const data = JSON.parse(event.data);
          store.setVTONResult(data.result_image_url);
          closeSSE();
        } catch (e) {
          store.setVTONError("Lỗi đọc dữ liệu từ server.");
          closeSSE();
        }
      });

      eventSourceRef.current.addEventListener('vision_error', (event) => {
        try {
          const data = JSON.parse(event.data);
          store.setVTONError(data.error_message || "Đã xảy ra lỗi AI.");
          closeSSE();
        } catch (e) {
          store.setVTONError("Lỗi kết nối đến server.");
          closeSSE();
        }
      });

      eventSourceRef.current.onerror = (error) => {
        console.error("SSE Error:", error);
        // We do not immediately close on error to allow auto-reconnect,
        // but if store state is pending for too long we might timeout.
      };

      // 3. Trigger the job
      const res = await fetch("http://localhost:9000/v1/vton/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          human_image_url: humanImageUrl,
          garment_image_url: garmentImageUrl,
          user_id: userId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to start Try-On job");
      }

      const data = await res.json();
      store.setJobId(data.data.job_id);

    } catch (error: any) {
      console.error(error);
      store.setVTONError(error.message);
      closeSSE();
    }
  };

  return {
    startTryOn,
    closeSSE,
  };
}
