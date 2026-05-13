import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../modules/ai-personalization/service"
import { removeBackground } from "@imgly/background-removal-node"
import fs from "fs"
import path from "path"
import { pathToFileURL } from "url"
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
    const fileUrl = pathToFileURL(inputPath).href
    console.log("Bắt đầu tiến trình xóa nền bằng AI cho ảnh:", fileUrl)
    
    // Xóa nền trực tiếp từ File URL và ép tải mô hình bằng CDN để chống lỗi pnpm symlink
    const resultBlob = await removeBackground(fileUrl, {
      publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/"
    })
    console.log("Xóa nền thành công!")
    
    // Save the processed image
    const arrayBuffer = await resultBlob.arrayBuffer()
    const rawBuffer = Buffer.from(arrayBuffer)
    
    // Sử dụng sharp để chuẩn hóa hình ảnh thành định dạng RGBA/RGB tiêu chuẩn
    // Việc này sẽ triệt tiêu cảnh báo "Palette images with Transparency..." bên Python
    const processedBuffer = await sharp(rawBuffer)
      .toFormat("png")
      .toBuffer()
    
    const processedFileName = `processed_${file.filename}.png`
    const processedFilePath = path.join(file.destination, processedFileName)
    
    fs.writeFileSync(processedFilePath, processedBuffer)
    
    // URL remains /uploads/ as we serve it via static middleware in middlewares.ts
    finalImageUrl = `/uploads/${processedFileName}`
  } catch (error) {
    console.error("Background removal failed:", error)
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
