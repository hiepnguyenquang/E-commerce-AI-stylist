import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { AmqplibAdapter } from "../../../../services/queue/AmqplibAdapter";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const queueService = new AmqplibAdapter();
    
    // Giả lập payload đồng bộ metadata sản phẩm (QUEUE-02)
    const payload = {
      event_type: "product_created",
      timestamp: new Date().toISOString(),
      data: {
        product_id: "prod_test_123",
        name: "Test T-Shirt",
        text_description: "A comfortable cotton t-shirt.",
        image_url: "http://example.com/image.jpg"
      },
      metadata: {
        category: "tops",
        gender: "unisex"
      }
    };

    const success = await queueService.publish("product_metadata_sync", payload);

    if (success) {
      res.status(200).json({
        status: "success",
        message: "Message published to RabbitMQ successfully",
        payload
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Failed to publish message to RabbitMQ"
      });
    }
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      details: error.message
    });
  }
}
