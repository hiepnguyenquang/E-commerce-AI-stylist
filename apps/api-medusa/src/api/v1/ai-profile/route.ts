import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AI_PERSONALIZATION_MODULE } from "../../../modules/ai-personalization"
import AiPersonalizationModuleService from "../../../modules/ai-personalization/service"
import fs from "fs"
import path from "path"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)
  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

  try {
    const profiles = await aiPersonalizationService.listAiProfiles({
      customer_id: customer_id
    })

    if (profiles && profiles.length > 0) {
      let profile = profiles[0]

      // Data Correction: Kiểm tra xem file vật lý có tồn tại không
      if (profile.base_body_image_url && profile.base_body_image_url.startsWith('/uploads/')) {
        const filename = profile.base_body_image_url.replace('/uploads/', '').replace(/\/$/, '')
        const filePath = path.join(process.cwd(), ".medusa", "uploads", filename)
        
        if (!fs.existsSync(filePath)) {
          console.log(`[Data Correction] File AI Profile không tồn tại vật lý: ${filename}. Cập nhật lại bản ghi DB.`)
          
          // Cập nhật lại db: xóa ảnh khỏi profile
          profile = await aiPersonalizationService.updateAiProfiles({
            id: profile.id,
            base_body_image_url: null as any
          })
        }
      }

      return res.json({
        status: "success",
        data: profile
      })
    }

    // Nếu chưa có profile, trả về data null
    return res.json({
      status: "success",
      data: null
    })
  } catch (error: any) {
    console.error("[GET /v1/ai-profile] Error:", error)
    return res.status(500).json({ status: "error", message: "Failed to fetch AI Profile" })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // 1. Get the service
  const aiPersonalizationService: AiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)

  // 2. Parse body (form-data or json)
  const { height, weight, gender, base_body_image_url } = req.body as any
  const file = (req as any).file

  const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

  let imageUrl = base_body_image_url
  if (file) {
    // If a file was uploaded, construct its public URL
    imageUrl = `/uploads/${file.filename}`
  }

  try {
    // 3. Check if profile already exists (Upsert logic)
    const existingProfiles = await aiPersonalizationService.listAiProfiles({
      customer_id: customer_id
    })

    let profile;
    const parsedHeight = height != null && height !== "" && !isNaN(Number(height)) ? Number(height) : undefined;
    const parsedWeight = weight != null && weight !== "" && !isNaN(Number(weight)) ? Number(weight) : undefined;
    const parsedGender = gender != null && gender !== "" ? String(gender) : undefined;

    if (existingProfiles && existingProfiles.length > 0) {
      // Cập nhật profile đã có
      const existing = existingProfiles[0];
      const updateData: any = { id: existing.id }
      if (parsedHeight !== undefined) updateData.height = parsedHeight;
      if (parsedWeight !== undefined) updateData.weight = parsedWeight;
      if (parsedGender !== undefined) updateData.gender = parsedGender;
      if (imageUrl !== undefined) {
        updateData.base_body_image_url = imageUrl;
      }

      profile = await aiPersonalizationService.updateAiProfiles(updateData)
      console.log(`[POST /v1/ai-profile] Updated profile for ${customer_id}`)
    } else {
      // Tạo profile mới
      const createData: any = { customer_id }
      if (parsedHeight !== undefined) createData.height = parsedHeight;
      if (parsedWeight !== undefined) createData.weight = parsedWeight;
      if (parsedGender !== undefined) createData.gender = parsedGender;
      if (imageUrl !== undefined) {
        createData.base_body_image_url = imageUrl;
      }

      profile = await aiPersonalizationService.createAiProfiles(createData)
      console.log(`[POST /v1/ai-profile] Created new profile for ${customer_id}`)
    }

    res.json({
      status: "success",
      data: {
        profile_id: profile.id,
        processed_image_url: profile.base_body_image_url,
        height: profile.height,
        weight: profile.weight,
        gender: profile.gender,
        vector_status: "pending" // Giả sử nếu có đồng bộ thì cập nhật
      }
    })
  } catch (error: any) {
    console.error("[POST /v1/ai-profile] Error:", error)
    return res.status(500).json({ status: "error", message: "Failed to process AI Profile" })
  }
}
