import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const completeOrderStep = createStep(
  "complete-order-step",
  async (input: { order_id: string }, { container }) => {
    console.log(`[completeOrderStep] Completing order ${input.order_id} (Status: paid)...`)
    return new StepResponse({ success: true, order_id: input.order_id })
  }
  // No compensation needed because it's the final successful step
)
