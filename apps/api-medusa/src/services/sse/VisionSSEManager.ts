import { amqpAdapter } from "../queue/AmqplibAdapter";

type SSEResponse = any; // Will be express Response or MedusaResponse

class VisionSSEManager {
  private clients: Map<string, SSEResponse[]> = new Map();
  private isConsuming = false;

  public async startConsuming(aiPersonalizationModuleService?: any) {
    if (this.isConsuming) return;
    this.isConsuming = true;

    try {
      await amqpAdapter.consume("ai_vision_results", async (payload: any) => {
        const { user_id, job_id, status, result_image_url, error_message } = payload;
        
        // Update database if service is provided
        if (aiPersonalizationModuleService && job_id) {
          try {
            await aiPersonalizationModuleService.updateVtonJobs({
              id: job_id,
              status: status,
              result_image_url: result_image_url,
              error_message: error_message,
            });
            console.log(`[VisionSSEManager] Updated job ${job_id} in database`);
          } catch (dbErr) {
            console.error(`[VisionSSEManager] Failed to update job ${job_id} in database:`, dbErr);
          }
        }

        if (user_id && this.clients.has(user_id)) {
          const userClients = this.clients.get(user_id) || [];
          
          userClients.forEach((res) => {
            // Write SSE data
            res.write(`event: vision_update\n`);
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          });
        }
      });
      console.log("[VisionSSEManager] Started consuming ai_vision_results");
    } catch (error) {
      console.error("[VisionSSEManager] Failed to start consumer:", error);
      this.isConsuming = false;
    }
  }

  public addClient(userId: string, res: SSEResponse) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)?.push(res);

    // Clean up when client disconnects
    res.on("close", () => {
      this.removeClient(userId, res);
    });
  }

  public removeClient(userId: string, res: SSEResponse) {
    if (this.clients.has(userId)) {
      const filtered = this.clients.get(userId)?.filter(c => c !== res) || [];
      if (filtered.length === 0) {
        this.clients.delete(userId);
      } else {
        this.clients.set(userId, filtered);
      }
    }
  }
}

export const visionSSEManager = new VisionSSEManager();
