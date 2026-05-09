import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const reserveInventoryStep = createStep(
  "reserve-inventory-step",
  async (input: { cart_id: string }, { container }) => {
    console.log(`[reserveInventoryStep] Locking inventory for cart ${input.cart_id}...`)
    // Mock logic
    return new StepResponse({ success: true }, { cart_id: input.cart_id })
  },
  async (compensation: { cart_id: string }, { container }) => {
    if (!compensation) return
    console.log(`[reserveInventoryStep] Compensating: Unlocking inventory for cart ${compensation.cart_id}...`)
    // Mock rollback
  }
)
