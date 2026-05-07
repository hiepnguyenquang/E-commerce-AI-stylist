import { model } from "@medusajs/framework/utils"

export const VtonJob = model.define("vton_job", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  parent_job_id: model.text().nullable(),
  step: model.text().nullable(),
  status: model.text().default("pending"),
  result_image_url: model.text().nullable(),
  error_message: model.text().nullable(),
  retry_count: model.number().default(0),
})
