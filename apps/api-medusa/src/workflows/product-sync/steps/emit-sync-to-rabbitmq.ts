import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { amqpAdapter } from "../../../services/queue/AmqplibAdapter"

export const emitSyncToRabbitMQStep = createStep(
  "emit-sync-to-rabbitmq-step",
  async (input: { event_type: string, product: any }, { container }) => {
    console.log(`[emitSyncToRabbitMQStep] Emitting sync event for product ${input.product.id}...`)
    
    try {
      const payload = {
        event_type: input.event_type,
        timestamp: new Date().toISOString(),
        data: {
          product_id: input.product.id,
          name: input.product.title,
          text_description: input.product.description,
          image_url: input.product.images?.[0]?.url || null,
        },
        metadata: {
          category: input.product.categories?.[0]?.name || null,
          gender: input.product.metadata?.gender || null, // Assuming gender is in metadata
        }
      }

      const published = await amqpAdapter.publish("product_metadata_sync", payload)

      if (!published) {
        console.warn(`[emitSyncToRabbitMQStep] Failed to publish product ${input.product.id} to RabbitMQ. Tracking for later.`)
        // Ghi log hoặc lưu ID vào một bảng retry (ai_sync_failures)
        return new StepResponse({ success: false, product_id: input.product.id }, null)
      }

      console.log(`[emitSyncToRabbitMQStep] Product ${input.product.id} sync event published successfully.`)
      return new StepResponse({ success: true, product_id: input.product.id }, null)

    } catch (err: any) {
      console.warn(`[emitSyncToRabbitMQStep] Error publishing product ${input.product.id} to RabbitMQ. Tracking for later: ${err.message}`)
      return new StepResponse({ success: false, product_id: input.product.id }, null)
    }
  }
  // Không có compensation: nếu gửi RabbitMQ lỗi thì không rollback việc tạo product.
)
