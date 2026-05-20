import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../modules/ai-personalization/service"
import fs from "fs"
import path from "path"
import { AmqplibAdapter } from "../../../../services/queue/AmqplibAdapter"
import sharp from "sharp"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)
  
  const { category, description } = req.body as any
  const file = (req as any).file

  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

  if (!file) {
    return res.status(400).json({ status: "error", message: "Garment image is required" })
  }

  let finalImageUrl = ""

  try {
    const inputPath = file.path
    console.log("Bắt đầu chuẩn hóa định dạng ảnh (không xóa nền):", inputPath)
    
    // Sử dụng sharp để chuẩn hóa hình ảnh gốc (không cắt nền)
    // Việc này sẽ triệt tiêu cảnh báo "Palette images with Transparency..." bên Python và tối ưu kích thước
    const processedBuffer = await sharp(inputPath)
      .toFormat("png")
      .toBuffer()
    
    const processedFileName = `processed_${file.filename}.png`
    const processedFilePath = path.join(file.destination, processedFileName)
    
    fs.writeFileSync(processedFilePath, processedBuffer)
    
    // URL remains /uploads/ as we serve it via static middleware in middlewares.ts
    finalImageUrl = `/uploads/${processedFileName}`
  } catch (error) {
    console.error("Image processing failed:", error)
    return res.status(500).json({ status: "error", message: "Failed to process image" })
  }

  const closetItem = await aiPersonalizationService.createUserClosetItems({
    customer_id,
    image_url: finalImageUrl,
    category: category || "unknown",
    metadata: description ? { description } : null,
    vector_status: "pending"
  })

  // Trigger synchronization to LanceDB
  try {
    const queueService = new AmqplibAdapter()
    const payload = {
      event_type: "closet_item_created",
      timestamp: new Date().toISOString(),
      data: {
        id: closetItem.id,
        user_id: customer_id,
        image_url: finalImageUrl,
        category: category || "unknown",
        description: description || ""
      }
    }
    await queueService.publish("closet_metadata_sync", payload)
    console.log(`[Queue] Published closet_metadata_sync for item ${closetItem.id}`)
  } catch (queueError) {
    console.error("[Queue] Failed to publish closet_metadata_sync event:", queueError)
    // We don't block the request if the queue fails, similar to product sync
  }

  res.json({
    status: "success",
    data: closetItem
  })
}
