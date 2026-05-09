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
        
        let finalPayloadToSend = payload;

        // Update database if service is provided
        if (aiPersonalizationModuleService && job_id) {
          try {
            await aiPersonalizationModuleService.updateVtonJobs({
              id: job_id,
              status: status,
              result_image_url: result_image_url,
              error_message: status === "failed" ? error_message : null,
            });
            console.log(`[VisionSSEManager] Updated job ${job_id} in database`);

            // ORCHESTRATION LOGIC FOR MULTI-STEP VTON
            if (status === "completed") {
                // Find if there is a child job waiting for this result
                const childJobs = await aiPersonalizationModuleService.listVtonJobs({
                    parent_job_id: job_id
                });

                if (childJobs && childJobs.length > 0) {
                    const nextJob = childJobs[0];
                    console.log(`[VisionSSEManager] Found child job ${nextJob.id}. Orchestrating next step...`);
                    
                    // The garment_image_url was temporarily stored in error_message during creation
                    const garmentUrl = nextJob.error_message; 

                    // Clear the temporary hack and update with actual human image url
                    await aiPersonalizationModuleService.updateVtonJobs({
                        id: nextJob.id,
                        error_message: null,
                    });

                    // Dispatch next job to RabbitMQ
                    let clothType = "upper"
                    if (nextJob.step?.includes("lower_body") || nextJob.step?.includes("bottom")) clothType = "lower"
                    if (nextJob.step?.includes("dress") || nextJob.step?.includes("overall")) clothType = "overall"

                    const nextPayload = {
                        job_id: nextJob.id,
                        user_id: user_id,
                        payload: {
                            images: {
                                person_image_url: result_image_url, // Output of previous becomes input of next
                                cloth_image_url: garmentUrl,
                                mask_image_url: null 
                            },
                            processing_params: {
                                cloth_type: clothType,
                                num_inference_steps: 25, 
                                guidance_scale: 2.5,
                                seed: -1,
                                width: 768,
                                height: 1024,
                                repaint: true
                            }
                        },
                        timestamp: new Date().toISOString()
                    };

                    await amqpAdapter.publish("ai_vision_jobs", nextPayload);

                    // Notify frontend that we are moving to the next step, not completed yet.
                    finalPayloadToSend = {
                        ...payload,
                        status: "processing_next_step",
                        message: `Moving to ${nextJob.step}`
                    };
                }
            }

          } catch (dbErr) {
            console.error(`[VisionSSEManager] Failed to update/orchestrate job ${job_id}:`, dbErr);
          }
        }

        if (user_id && this.clients.has(user_id)) {
          const userClients = this.clients.get(user_id) || [];
          
          userClients.forEach((res) => {
            // Write SSE data
            res.write(`event: vision_update\n`);
            res.write(`data: ${JSON.stringify(finalPayloadToSend)}\n\n`);
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
