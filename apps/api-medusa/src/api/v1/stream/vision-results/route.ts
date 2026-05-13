import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { visionSSEManager } from "../../../../services/sse/VisionSSEManager"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const userId = req.query.user_id as string

  if (!userId) {
    res.status(400).json({ error: "Missing user_id query parameter" })
    return
  }

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
