import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { checkoutWorkflow } from "../../../workflows/checkout/checkout-workflow"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { cart_id, payment_method } = req.body as any

  if (!cart_id || !payment_method) {
    res.status(400).json({ error: "Missing cart_id or payment_method" })
    return
  }

  try {
    const { result, errors } = await checkoutWorkflow(req.scope).run({
      input: {
        cart_id,
        payment_method,
      },
      throwOnError: false
    })

    if (errors && errors.length > 0) {
      console.error("[Checkout] Saga Workflow failed:", errors)
      res.status(500).json({
        status: "error",
        error_code: "CHECKOUT_FAILED",
        message: "Payment or Order processing failed, all steps were rolled back.",
        details: errors.map(e => e.error?.message || e.error)
      })
      return
    }

    // TODO: Tracking chuyển đổi (Conversion)
    // Nếu item trong giỏ có stylist_session_id hoặc vton_job_id, cập nhật dữ liệu để đánh giá hiệu quả AI.

    res.status(200).json({
      status: "success",
      data: result,
    })
  } catch (err: any) {
    console.error("[Checkout] Error:", err)
    res.status(500).json({
      status: "error",
      error_code: "INTERNAL_ERROR",
      message: err.message,
    })
  }
}
