import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { visionSSEManager } from "../../../../services/sse/VisionSSEManager"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const userId = req.query.user_id as string

  if (!userId) {
    res.status(400).json({ error: "Missing user_id query parameter" })
    return
  }

  const aiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)

  // Ensure the consumer is running (will only start once)
  visionSSEManager.startConsuming(aiPersonalizationModuleService).catch(console.error)

  // Configure SSE headers
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  
  // Flush headers to establish connection
  res.flushHeaders()

  // Send an initial heartbeat
  res.write("event: ping\ndata: connected\n\n")

  visionSSEManager.addClient(userId, res)
}
