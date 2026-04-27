import { z } from 'zod';

// Chuẩn phản hồi lỗi chung cho toàn hệ thống
// Quy định tại: .ai-knowledge/00_architecture_rules.md
export const GlobalErrorResponseSchema = z.object({
  status: z.literal('error'),
  error_code: z.string(), // VD: INSUFFICIENT_STOCK, AI_SERVICE_UNAVAILABLE
  message: z.string(),
  details: z.record(z.any()).optional(), // Payload linh hoạt để debug
});

// Xuất type tĩnh cho TypeScript
export type GlobalErrorResponse = z.infer<typeof GlobalErrorResponseSchema>;
