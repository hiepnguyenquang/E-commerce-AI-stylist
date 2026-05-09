import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const processPaymentStep = createStep(
  "process-payment-step",
  async (input: { order_id: string, payment_method: string }, { container }) => {
    console.log(`[processPaymentStep] Processing payment for order ${input.order_id} using ${input.payment_method}...`)
    
    // Giả lập logic thanh toán (MVP)
    // Nếu mock muốn thất bại để test Saga Rollback, bạn có thể truyền payment_method = 'fail'
    const isSuccess = input.payment_method !== 'fail'
    
    if (!isSuccess) {
      console.log(`[processPaymentStep] Payment failed! Triggering rollback...`)
      throw new Error("Payment failed via Mock Gateway!")
    }

    const transactionId = `txn_${Date.now()}`
    console.log(`[processPaymentStep] Payment successful. Transaction ID: ${transactionId}`)
    
    return new StepResponse({ transaction_id: transactionId }, { order_id: input.order_id, transaction_id: transactionId })
  },
  async (compensation: { order_id: string, transaction_id: string }, { container }) => {
    if (!compensation) return
    console.log(`[processPaymentStep] Compensating: Refunding transaction ${compensation.transaction_id} for order ${compensation.order_id}...`)
  }
)
