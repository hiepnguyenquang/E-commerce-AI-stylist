import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { current_option_id, target_product_id, context_items, action } = req.body as any
  const aiPersonalizationModuleService = req.scope.resolve("aiPersonalization")
  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  if (!target_product_id) {
    return res.status(400).json({ status: "error", message: "Missing target_product_id" })
  }

  try {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "your_super_secret_internal_key_here"
    const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/v1/stylist/replace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        current_option_id,
        target_product_id,
        context_items: context_items || [],
        action: action || "similar_search",
        user_id: customer_id
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      throw new Error(`AI Service error: ${errorData}`)
    }

    const aiData = await aiResponse.json()
    const similarItems = aiData.data || [] // List of { product_id, source, ... }

    if (similarItems.length === 0) {
        return res.json({
            status: "success",
            data: []
        })
    }

    // Hydrate the items
    const productIds = similarItems.filter((i: any) => i.source === "store").map((i: any) => i.product_id)
    const closetItemIds = similarItems.filter((i: any) => i.source === "closet").map((i: any) => i.product_id)

    let productsMap: Record<string, any> = {}
    let closetMap: Record<string, any> = {}

    if (productIds.length > 0) {
        const products = await productModuleService.listProducts(
            { id: productIds },
            { relations: ["variants"] }
        )
        products.forEach(p => {
            productsMap[p.id] = {
                id: p.id,
                title: p.title,
                thumbnail: p.thumbnail,
                variants: p.variants || [],
                type: 'store'
            }
        })
    }

    if (closetItemIds.length > 0) {
        const closetItems = await aiPersonalizationModuleService.listUserClosetItems({
            id: closetItemIds
        })
        closetItems.forEach(c => {
            closetMap[c.id] = {
                id: c.id,
                title: `Trang phục cá nhân (${c.category || 'unknown'})`,
                thumbnail: c.image_url,
                variants: [],
                type: 'closet'
            }
        })
    }

    const hydratedItems: any[] = []
    similarItems.forEach((item: any) => {
        const id = item.product_id
        const itemData = productsMap[id] || closetMap[id]
        if (itemData) {
            hydratedItems.push(itemData)
        }
    })

    // (Optional) Ghi nhận thay đổi vào DB theo yêu cầu:
    // "Ghi nhận product_id cũ vào trường replaces_item_id và thêm bản ghi mới cho product_id thay thế."
    // Ở MVP có thể tạm bỏ qua việc ghi db hoặc client tự quyết định. Chúng ta trả về danh sách gợi ý.
    
    return res.json({
      status: "success",
      data: hydratedItems
    })

  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: "Stylist replace failed",
      details: { error: error.message }
    })
  }
}
