import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../modules/ai-personalization/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)
  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

  try {
    const sessions = await aiPersonalizationService.listStylistSessions({
      customer_id: customer_id
    }, {
      order: { created_at: "DESC" },
      take: 20
    })

    return res.json({
      status: "success",
      data: sessions
    })
  } catch (error: any) {
    console.error("[GET /v1/stylist/sessions] Error:", error)
    return res.status(500).json({ status: "error", message: "Failed to fetch stylist sessions" })
  }
}
