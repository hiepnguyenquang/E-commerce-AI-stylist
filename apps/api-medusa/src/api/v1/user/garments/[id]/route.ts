import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../../modules/ai-personalization/service"
import fs from "fs"
import path from "path"
import { AmqplibAdapter } from "../../../../../services/queue/AmqplibAdapter"

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)
  
  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"
  const garment_id = req.params.id

  if (!garment_id) {
    return res.status(400).json({ status: "error", message: "Garment ID is required" })
  }

  try {
    // 1. Lấy thông tin trang phục
    const item = await aiPersonalizationService.retrieveUserClosetItem(garment_id).catch(() => null)
    
    if (!item) {
      return res.status(404).json({ status: "error", message: "Garment not found" })
    }

    // 2. Xác thực quyền sở hữu
    if (item.customer_id !== customer_id) {
      return res.status(403).json({ status: "error", message: "Forbidden: You don't own this item" })
    }

    // 3. Xóa file vật lý (nếu có)
    if (item.image_url && item.image_url.startsWith('/uploads/')) {
      const filename = item.image_url.replace('/uploads/', '').replace(/\/$/, '')
      const filePath = path.join(process.cwd(), ".medusa", "uploads", filename)
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
        console.log(`[Closet Deletion] Đã xóa file vật lý: ${filePath}`)
      }
    }

    // 4. Xóa bản ghi trong Database
    await aiPersonalizationService.deleteUserClosetItems([garment_id])
    console.log(`[Closet Deletion] Đã xóa bản ghi DB: ${garment_id}`)

    // 5. Đồng bộ xóa Vector AI (RabbitMQ)
    try {
      const queueService = new AmqplibAdapter()
      const payload = {
        event_type: "closet_item_deleted",
        timestamp: new Date().toISOString(),
        data: {
          id: garment_id,
          user_id: customer_id
        }
      }
      await queueService.publish("closet_metadata_sync", payload)
      console.log(`[Queue] Published closet_metadata_sync (deleted) for item ${garment_id}`)
    } catch (queueError) {
      console.error("[Queue] Failed to publish delete sync event:", queueError)
    }

    return res.json({ status: "success", message: "Garment deleted successfully" })
  } catch (error: any) {
    console.error("[Closet Deletion] Error:", error)
    return res.status(500).json({ status: "error", message: error.message || "Failed to delete garment" })
  }
}
