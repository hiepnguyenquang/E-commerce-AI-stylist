import { LoaderOptions } from "@medusajs/framework/types";
import { amqpAdapter } from "../../../services/queue/AmqplibAdapter";
import { VisionOrchestrator } from "../../../services/queue/VisionOrchestrator";
import { visionSSEManager } from "../../../services/sse/VisionSSEManager";
import { AI_PERSONALIZATION_MODULE } from "../index";

export default async function visionConsumerLoader({
  container,
  options,
}: LoaderOptions) {
  console.log("[visionConsumerLoader] Starting RabbitMQ consumer for ai_vision_results...");

  try {
    await amqpAdapter.consume("ai_vision_results", async (payload: any) => {
      let finalPayloadToSend = payload;

      try {
        const vtonJobService = container.resolve("vtonJobService");
        
        const mockModuleService = {
          updateVtonJobs: async (data: any) => await vtonJobService.update(data),
          listVtonJobs: async (filters: any) => await vtonJobService.list(filters)
        };
        
        // 1. Giao cho Orchestrator xử lý (Lưu DB, trigger Job tiếp theo nếu có)
        finalPayloadToSend = await VisionOrchestrator.processVisionResult(
          payload, 
          mockModuleService
        );

      } catch (err) {
        console.error("[visionConsumerLoader] Error processing orchestrator:", err);
      }

      // 2. Broadcast qua SSE cho các client đang kết nối
      const { user_id } = payload;
      if (user_id) {
        visionSSEManager.broadcast(user_id, finalPayloadToSend);
      }
    });

    console.log("[visionConsumerLoader] Started consuming ai_vision_results");
  } catch (error) {
    console.error("[visionConsumerLoader] Failed to start consumer:", error);
  }
}

