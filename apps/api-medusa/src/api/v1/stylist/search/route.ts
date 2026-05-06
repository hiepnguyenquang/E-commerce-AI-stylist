import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { query_text, limit_options } = req.body as any
  const aiPersonalizationModuleService = req.scope.resolve("aiPersonalization")

  if (!query_text) {
    return res.status(400).json({ status: "error", message: "Missing query_text" })
  }

  try {
    // Gọi sang FastAPI
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "your_super_secret_internal_key_here"

    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/v1/stylist/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        query_text,
        limit_options: limit_options || 2
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      throw new Error(`AI Service error: ${errorData}`)
    }

    const aiData = await aiResponse.json()

    // Lưu session vào DB
    // Trong môi trường thật, cần lấy customer_id từ auth token
    const customer_id = "anonymous_session" 
    
    const session = await aiPersonalizationModuleService.createStylistSessions({
      customer_id: customer_id,
      prompt: query_text,
      status: "completed",
    })

    const itemsToCreate: any[] = []
    
    // Duyệt mảng options trả về từ AI để bóc tách các product_id
    if (aiData.options && Array.isArray(aiData.options)) {
        aiData.options.forEach((opt: any) => {
            if (opt.items && Array.isArray(opt.items)) {
                opt.items.forEach((productId: string) => {
                    itemsToCreate.push({
                        session: session.id,
                        product_id: productId,
                    })
                })
            }
        })
    }

    if (itemsToCreate.length > 0) {
        await aiPersonalizationModuleService.createStylistSessionItems(itemsToCreate)
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