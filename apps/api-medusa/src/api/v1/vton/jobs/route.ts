import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { amqpAdapter } from "../../../../services/queue/AmqplibAdapter"
import { AI_PERSONALIZATION_MODULE } from "../../../../modules/ai-personalization"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { human_image_url, garment_image_url, garments, user_id } = req.body as any

    if (!user_id || !human_image_url) {
      res.status(400).json({
        status: "error",
        error_code: "INVALID_PAYLOAD",
        message: "Missing human_image_url or user_id",
      })
      return
    }

    // Determine the list of garments to process (support both single and array payloads)
    let garmentsToProcess: { url: string, type: string }[] = []
    
    if (garments && Array.isArray(garments) && garments.length > 0) {
        garmentsToProcess = garments
    } else if (garment_image_url) {
        garmentsToProcess = [{ url: garment_image_url, type: "upper_body" }]
    } else {
        res.status(400).json({
            status: "error",
            error_code: "INVALID_PAYLOAD",
            message: "Missing garment information (provide garment_image_url or garments array)",
        })
        return
    }

    const aiPersonalizationModuleService = req.scope.resolve(AI_PERSONALIZATION_MODULE)

    // Pipeline generation: Create a chain of jobs
    let parentJobId: string | null = null
    let firstJobId: string | null = null

    for (let i = 0; i < garmentsToProcess.length; i++) {
        const garment = garmentsToProcess[i]
        
        // For the first job, we use the human_image_url. 
        // For subsequent jobs, we leave it null; it will be filled by the orchestrator.
        const currentHumanUrl = i === 0 ? human_image_url : null

        const vtonJob = await aiPersonalizationModuleService.createVtonJobs({
            customer_id: user_id,
            parent_job_id: parentJobId || undefined,
            step: `step_${i + 1}_${garment.type}`,
            status: "pending",
            // We need a custom way to store garment url for later use if it's not in the main schema
            // Since we don't have a direct garment_url field, we can store it in error_message temporarily 
            // OR ideally we should pass it via the queue for the first job.
        })
        
        // We will store the garment_url in the error_message field temporarily for the orchestrator to pick up later.
        // A better approach is to add a metadata JSONB field to the vton_jobs table, but this works for MVP.
        await aiPersonalizationModuleService.updateVtonJobs({
            id: vtonJob.id,
            error_message: garment.url // Hack for MVP: storing garment url here temporarily
        })

        if (i === 0) {
            firstJobId = vtonJob.id
            
            let clothType = "upper"
            if (garment.type === "lower_body" || garment.type === "bottom") clothType = "lower"
            if (garment.type === "dress" || garment.type === "overall") clothType = "overall"

            // Only publish the FIRST job to the queue
            const payload = {
                job_id: vtonJob.id,
                user_id: user_id,
                payload: {
                    images: {
                        person_image_url: currentHumanUrl,
                        cloth_image_url: garment.url,
                        mask_image_url: null 
                    },
                    processing_params: {
                        cloth_type: clothType,
                        num_inference_steps: 25, // Optimized for speed MVP, max 50
                        guidance_scale: 2.5,
                        seed: -1,
                        width: 768,
                        height: 1024,
                        repaint: true
                    }
                },
                timestamp: new Date().toISOString()
            }

            const published = await amqpAdapter.publish("ai_vision_jobs", payload)

            if (!published) {
                throw new Error("Failed to queue the initial vision job")
            }
        }
        
        // The current job becomes the parent for the next iteration
        parentJobId = vtonJob.id
    }

    res.status(200).json({
      status: "success",
      data: {
        job_id: firstJobId,
        message: `Queued pipeline of ${garmentsToProcess.length} jobs`
      },
    })
  } catch (error: any) {
    console.error("[VTON Jobs] Error:", error)
    res.status(500).json({
      status: "error",
      error_code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    })
  }
}
