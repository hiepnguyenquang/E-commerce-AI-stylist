import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../modules/ai-personalization/service"
import fs from "fs"
import path from "path"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)
  
  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"
  const category = req.query.category as string | undefined

  const filters: any = { customer_id }
  if (category) {
    filters.category = category
  }

  const items = await aiPersonalizationService.listUserClosetItems(filters)

  // Tự động làm sạch dữ liệu mồ côi (Data Correction)
  const validItems = []
  const itemsToDelete: string[] = []

  for (const item of items) {
    if (item.image_url && item.image_url.startsWith('/uploads/')) {
      // Xóa dấu gạch chéo trailing nếu có (đề phòng) và lấy filename
      const filename = item.image_url.replace('/uploads/', '').replace(/\/$/, '')
      const filePath = path.join(process.cwd(), ".medusa", "uploads", filename)
      
      if (!fs.existsSync(filePath)) {
        console.log(`[Data Correction] File không tồn tại vật lý: ${filename}. Chuẩn bị xóa bản ghi DB.`)
        itemsToDelete.push(item.id)
        continue
      }
    }
    validItems.push(item)
  }

  if (itemsToDelete.length > 0) {
    try {
      await aiPersonalizationService.deleteUserClosetItems(itemsToDelete)
      console.log(`[Data Correction] Đã tự động xóa ${itemsToDelete.length} bản ghi rác khỏi DB.`)
    } catch (e) {
      console.error("[Data Correction] Lỗi khi xóa bản ghi mồ côi:", e)
    }
  }

  res.json({
    status: "success",
    data: validItems
  })
}
