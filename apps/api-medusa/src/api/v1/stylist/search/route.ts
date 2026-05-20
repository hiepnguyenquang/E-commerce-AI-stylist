import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { query_text, limit_options } = req.body as any
  const aiPersonalizationModuleService = req.scope.resolve("aiPersonalization")
  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  if (!query_text) {
    return res.status(400).json({ status: "error", message: "Missing query_text" })
  }

  try {
    // Gọi sang FastAPI
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "your_super_secret_internal_key_here"

    const customer_id = (req as any).auth_context?.actor_id || req.headers["x-customer-id"] || "mock-customer-id"

    // Lấy giới tính từ AI Profile
    let userGender = "unisex";
    try {
      const profiles = await aiPersonalizationModuleService.listAiProfiles({ customer_id });
      if (profiles && profiles.length > 0 && profiles[0].gender) {
        userGender = profiles[0].gender;
      }
    } catch (e) {
      console.warn("Could not fetch user profile for gender", e);
    }

    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/v1/stylist/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        query_text,
        limit_options: limit_options || 2,
        user_id: customer_id,
        gender: userGender
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      throw new Error(`AI Service error: ${errorData}`)
    }

    const aiData = await aiResponse.json()

    if (aiData.refusal) {
      return res.json({
        status: "success",
        data: {
            refusal: true,
            message: aiData.message,
            options: []
        }
      })
    }

    // Lưu session vào DB
    const session = await aiPersonalizationModuleService.createStylistSessions({
      customer_id: customer_id,
      prompt: query_text,
      status: "completed",
    })

    const itemsToCreate: any[] = []
    
    // --- BẮT ĐẦU LOGIC HYDRATE ---
    // Tập hợp tất cả ID cần lấy
    const productIds: string[] = []
    const closetItemIds: string[] = []

    if (aiData.options && Array.isArray(aiData.options)) {
        aiData.options.forEach((opt: any) => {
            if (opt.items && Array.isArray(opt.items)) {
                opt.items.forEach((id: string) => {
                    // ID sản phẩm Medusa thường bắt đầu bằng prod_
                    if (id.startsWith("prod_")) {
                        productIds.push(id)
                    } else {
                        closetItemIds.push(id)
                    }
                    // Lưu session item db
                    itemsToCreate.push({
                        session: session.id,
                        product_id: id.startsWith("prod_") ? id : null, // Tuỳ schema DB
                        replaces_item_id: !id.startsWith("prod_") ? id : null // Dùng tạm field này lưu closet id
                    })
                })
            }
        })
    }

    // Fetch dữ liệu thật
    let productsMap: Record<string, any> = {}
    let closetMap: Record<string, any> = {}

    if (productIds.length > 0) {
        const products = await productModuleService.listProducts(
            { id: productIds },
            { relations: ["variants", "categories"] }
        )
        products.forEach(p => {
            let catName = ""
            if (p.categories && p.categories.length > 0) {
                catName = p.categories[0].name.toLowerCase()
            }
            let cType = "upper_body"
            if (catName.includes("quần") || catName.includes("váy") || catName.includes("bottom") || catName.includes("skirt")) cType = "lower_body"
            if (catName.includes("đầm") || catName.includes("dress") || catName.includes("liền")) cType = "dress"
            
            const lowerTitle = (p.title || "").toLowerCase()
            if (lowerTitle.includes("quần") || lowerTitle.includes("chân váy") || lowerTitle.includes("skirt") || lowerTitle.includes("bottom") || lowerTitle.includes("jeans") || lowerTitle.includes("shorts")) cType = "lower_body"
            if (lowerTitle.includes("đầm") || lowerTitle.includes("dress") || (lowerTitle.includes("váy") && !lowerTitle.includes("chân váy"))) cType = "dress"

            productsMap[p.id] = {
                id: p.id,
                title: p.title,
                thumbnail: p.thumbnail,
                variants: p.variants || [],
                type: 'store',
                clothing_type: cType
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
                type: 'closet',
                clothing_type: c.category || 'upper_body'
            }
        })
    }

    // Lắp ghép (Hydrate) lại vào mảng options
    if (aiData.options && Array.isArray(aiData.options)) {
        aiData.options.forEach((opt: any) => {
            if (opt.items && Array.isArray(opt.items)) {
                const hydratedItems: any[] = []
                opt.items.forEach((id: string) => {
                    const itemData = productsMap[id] || closetMap[id]
                    if (itemData) {
                        hydratedItems.push(itemData)
                    } else {
                        // Fallback an toàn: Nếu ID bị ảo giác, thay thế bằng một sản phẩm ngẫu nhiên trong productsMap (nếu có)
                        const availableStoreProducts = Object.values(productsMap);
                        if (availableStoreProducts.length > 0) {
                            const fallbackItem = availableStoreProducts[Math.floor(Math.random() * availableStoreProducts.length)];
                            hydratedItems.push(fallbackItem);
                        } else {
                            hydratedItems.push({
                                id: id,
                                title: "Sản phẩm không khả dụng",
                                thumbnail: null,
                                variants: [],
                                type: id.startsWith("prod_") ? 'store' : 'closet',
                                clothing_type: 'upper_body'
                            })
                        }
                    }
                })
                opt.items = hydratedItems // Ghi đè mảng String bằng mảng Object
            }
        })
    }
    // --- KẾT THÚC LOGIC HYDRATE ---

    // Ghi db: ta bỏ qua lỗi khoá ngoại nếu schema không support closet_id trong session items, MVP ta skip lỗi này
    if (itemsToCreate.length > 0) {
        try {
           // Lọc chỉ lưu những thằng có product_id thực sự vào db nếu DB bắt buộc
           const validStoreItems = itemsToCreate.filter(i => i.product_id)
           if (validStoreItems.length > 0) {
               await aiPersonalizationModuleService.createStylistSessionItems(validStoreItems)
           }
        } catch (e) {
           console.log("Skip saving some session items due to schema constraint")
        }
    }

    // Cập nhật lại session với reasoning (tổng hợp tiêu đề)
    const reasoning = aiData.options.map((o: any) => o.title).join(" | ")
    await aiPersonalizationModuleService.updateStylistSessions({
        id: session.id,
        reasoning: reasoning
    })

    // Trả về cho Frontend
    return res.json({
      status: "success",
      data: {
          session_id: session.id,
          options: aiData.options
      }
    })

  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: "Stylist search failed",
      details: { error: error.message }
    })
  }
}