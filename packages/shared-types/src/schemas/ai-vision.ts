import { z } from 'zod';

// Hợp đồng gửi từ Node.js (BFF) sang FastAPI (AI Vision) qua RabbitMQ
// Hàng đợi: ai_vision_jobs
export const AIVisionJobPayloadSchema = z.object({
  job_id: z.string().uuid(),
  parent_job_id: z.string().uuid().optional().nullable(),
  step: z.string(), // VD: "mix_top", "mix_bottom", "full_body", "outfit"
  user_id: z.string().uuid(),
  human_image_url: z.string().url("Must be a valid URL for human image"),
  garment_image_urls: z.array(z.string().url("Must be a valid URL for garment image")).min(1),
  category: z.enum(['upper_body', 'lower_body', 'dress', 'accessory', 'outfit']),
  engine: z.enum(['local', 'cloud', 'auto']).default('auto').optional(),
  options: z.object({
    prefetch: z.boolean().default(false),
    resolution: z.enum(['1024x768']).default('1024x768'), // Fix cứng theo chuẩn mô hình CatVTON (00_architecture_rules.md)
  }).optional(),
});

export type AIVisionJobPayload = z.infer<typeof AIVisionJobPayloadSchema>;

// Hợp đồng FastAPI gửi ngược lại Node.js sau khi tạo ảnh xong
// Hàng đợi: ai_vision_results
export const AIVisionResultPayloadSchema = z.object({
  job_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  result_image_url: z.string().url().nullable(),
  error_message: z.string().nullable(),
});

export type AIVisionResultPayload = z.infer<typeof AIVisionResultPayloadSchema>;
