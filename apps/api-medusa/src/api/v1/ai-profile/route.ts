import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../modules/ai-personalization/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // 1. Get the service
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)

  // 2. Parse body (form-data or json)
  const { height, weight, base_body_image_url } = req.body as any
  const file = (req as any).file

  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

  let imageUrl = base_body_image_url
  if (file) {
    // If a file was uploaded, construct its public URL
    // URL remains /uploads/ as we serve .medusa/uploads via static middleware
    imageUrl = `/uploads/${file.filename}`
  }


  // 3. Create or update profile
  const profile = await aiPersonalizationService.createAiProfiles({
    customer_id,
    height: height ? parseFloat(height) : null,
    weight: weight ? parseFloat(weight) : null,
    base_body_image_url: imageUrl
  })

  res.json({
    status: "success",
    data: {
      profile_id: profile.id,
      processed_image_url: profile.base_body_image_url,
      vector_status: "pending"
    }
  })
}
