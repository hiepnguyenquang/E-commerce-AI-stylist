import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { reserveInventoryStep } from "./steps/reserve-inventory"
import { createPendingOrderStep } from "./steps/create-pending-order"
import { processPaymentStep } from "./steps/process-payment"
import { completeOrderStep } from "./steps/complete-order"

interface CheckoutWorkflowInput {
  cart_id: string
  payment_method: string
}

export const checkoutWorkflow = createWorkflow(
  "checkout-saga-workflow",
  function (input: CheckoutWorkflowInput) {
    const inventoryResult = reserveInventoryStep({ cart_id: input.cart_id })
    
    const pendingOrderResult = createPendingOrderStep({ cart_id: input.cart_id })
    
    const paymentResult = processPaymentStep({
      order_id: pendingOrderResult.order_id,
      payment_method: input.payment_method
    })
    
    const completeResult = completeOrderStep({ order_id: pendingOrderResult.order_id })
    
    return new WorkflowResponse({
      success: true,
      order_id: pendingOrderResult.order_id,
      transaction_id: paymentResult.transaction_id
    })
  }
)
