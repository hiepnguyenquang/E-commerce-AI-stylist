import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitSyncToRabbitMQStep } from "./steps/emit-sync-to-rabbitmq"

export const productSyncWorkflow = createWorkflow(
  "product-sync-workflow",
  function (input: { event_type: string, product: any }) {
    const result = emitSyncToRabbitMQStep({
      event_type: input.event_type,
      product: input.product
    })

    return new WorkflowResponse(result)
  }
)
