import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../modules/ai-personalization/service"

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

  res.json({
    status: "success",
    data: items
  })
}
