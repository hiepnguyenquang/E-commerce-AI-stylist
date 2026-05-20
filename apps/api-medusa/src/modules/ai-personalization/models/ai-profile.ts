import { model } from "@medusajs/framework/utils"

const AiProfile = model.define("ai_profile", {
  id: model.id().primaryKey(),
  customer_id: model.text(), // Medusa doesn't have a direct relation type for external modules easily unless defined, text is safe for custom modules linking to core entities
  height: model.bigNumber().nullable(), // cm
  weight: model.bigNumber().nullable(), // kg
  gender: model.text().nullable(),
  base_body_image_url: model.text().nullable(),
})

export default AiProfile
