import { amqpAdapter } from "./AmqplibAdapter";

export class VisionOrchestrator {
  public static async processVisionResult(payload: any, aiPersonalizationModuleService: any) {
    const { user_id, job_id, status, result_image_url, error_message } = payload;

    // 1. Cập nhật kết quả vào database
    if (aiPersonalizationModuleService && job_id) {
      try {
        await aiPersonalizationModuleService.updateVtonJobs({
          id: job_id,
          status: status,
          result_image_url: result_image_url,
          error_message: status === "failed" ? error_message : null,
        });
        console.log(`[VisionOrchestrator] Updated job ${job_id} in database`);

        // 2. Nếu job hoàn tất, tìm xem có job con (child job) nào đang đợi kết quả làm đầu vào không
        if (status === "completed") {
          const childJobs = await aiPersonalizationModuleService.listVtonJobs({
            parent_job_id: job_id,
          });

          if (childJobs && childJobs.length > 0) {
            const nextJob = childJobs[0];
            console.log(`[VisionOrchestrator] Found child job ${nextJob.id}. Orchestrating next step...`);

            // The garment_image_url was temporarily stored in error_message during creation
            const garmentUrl = nextJob.error_message;

            // Clear the temporary hack and update with actual human image url
            await aiPersonalizationModuleService.updateVtonJobs({
              id: nextJob.id,
              error_message: null,
            });

            // Prepare for RabbitMQ
            let clothType = "upper";
            if (nextJob.step?.includes("lower_body") || nextJob.step?.includes("bottom")) clothType = "lower";
            if (nextJob.step?.includes("dress") || nextJob.step?.includes("overall")) clothType = "overall";

            const nextPayload = {
              job_id: nextJob.id,
              user_id: user_id,
              payload: {
                images: {
                  person_image_url: result_image_url, // Result of this job becomes input of the next
                  cloth_image_url: garmentUrl,
                  mask_image_url: null,
                },
                processing_params: {
                  cloth_type: clothType,
                  num_inference_steps: 25,
                  guidance_scale: 2.5,
                  seed: -1,
                  width: 768,
                  height: 1024,
                  repaint: true,
                },
              },
              timestamp: new Date().toISOString(),
            };

            await amqpAdapter.publish("ai_vision_jobs", nextPayload);

            // Thay vì đổi trạng thái của child, ta trả về payload báo cho Frontend
            return {
              ...payload,
              status: "processing_next_step",
              message: `Moving to ${nextJob.step}`,
            };
          }
        }
      } catch (dbErr) {
        console.error(`[VisionOrchestrator] Failed to update/orchestrate job ${job_id}:`, dbErr);
      }
    }

    return payload; // Trả về payload nguyên bản nếu không có Orchestration
  }
}
