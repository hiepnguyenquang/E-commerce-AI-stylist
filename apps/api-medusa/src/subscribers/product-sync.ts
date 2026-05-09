import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { productSyncWorkflow } from "../workflows/product-sync/product-sync-workflow"
import { Modules } from "@medusajs/framework/utils"

export default async function productSyncHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(`[ProductSyncSubscriber] Received event: ${name} for product ID: ${data.id}`)

  try {
    const query = container.resolve("query")
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "description", "images.*", "categories.*", "metadata"],
      filters: { id: data.id },
    })

    if (!products || products.length === 0) {
      console.warn(`[ProductSyncSubscriber] Product ${data.id} not found in DB.`)
      return
    }

    const product = products[0]

    await productSyncWorkflow(container).run({
      input: {
        event_type: name,
        product: product,
      },
    })
    
  } catch (error) {
    console.error(`[ProductSyncSubscriber] Error syncing product ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
