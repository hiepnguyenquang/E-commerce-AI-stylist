import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { amqpAdapter } from "../../../../services/queue/AmqplibAdapter"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // In MVP, we might not have full user session if not authenticated,
    // but the payload should contain user_id from the frontend.
    const { human_image_url, garment_image_url, user_id } = req.body as any

    if (!human_image_url || !garment_image_url || !user_id) {
      res.status(400).json({
        status: "error",
        error_code: "INVALID_PAYLOAD",
        message: "Missing human_image_url, garment_image_url, or user_id",
      })
      return
    }

    const aiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)

    // Create vton_job record
    const vtonJob = await aiPersonalizationModuleService.createVtonJobs({
      customer_id: user_id,
      step: "init",
      status: "pending",
    })

    const payload = {
      job_id: vtonJob.id,
      user_id: user_id,
      human_image_url,
      garment_image_url,
      category: "upper_body", // Default or extract from payload
    }

    // Publish to RabbitMQ
    const published = await amqpAdapter.publish("ai_vision_jobs", payload)

    if (!published) {
      res.status(500).json({
        status: "error",
        error_code: "MESSAGE_BROKER_ERROR",
        message: "Failed to queue the vision job",
      })
      return
    }

    res.status(200).json({
      status: "success",
      data: {
        job_id: vtonJob.id,
      },
    })
  } catch (error: any) {
    console.error("[VTON Jobs] Error:", error)
    res.status(500).json({
      status: "error",
      error_code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    })
  }
}
