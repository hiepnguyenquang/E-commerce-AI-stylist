import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const createPendingOrderStep = createStep(
  "create-pending-order-step",
  async (input: { cart_id: string }, { container }) => {
    console.log(`[createPendingOrderStep] Creating pending order for cart ${input.cart_id}...`)
    const orderId = `order_${Date.now()}`
    return new StepResponse({ order_id: orderId }, { order_id: orderId })
  },
  async (compensation: { order_id: string }, { container }) => {
    if (!compensation) return
    console.log(`[createPendingOrderStep] Compensating: Canceling order ${compensation.order_id}...`)
  }
)
