import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../../../modules/ai-personalization/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)
  
  const { image_url, selectedOutfit } = req.body as { image_url: string, selectedOutfit: any }

  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

  if (!image_url) {
    return res.status(400).json({ status: "error", message: "image_url is required" })
  }

  try {
    const closetItem = await aiPersonalizationService.createUserClosetItems({
      customer_id,
      image_url,
      category: "outfit",
      metadata: { 
          source: "vton_result",
          components: selectedOutfit 
      },
      vector_status: "not_applicable" // No need to vectorize complete outfits for now
    })

    res.json({
      status: "success",
      data: closetItem
    })
  } catch (error) {
    console.error("Failed to save VTON result:", error)
    return res.status(500).json({ status: "error", message: "Failed to save VTON result" })
  }
}
