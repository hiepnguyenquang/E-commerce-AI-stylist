import { model } from "@medusajs/framework/utils"

const UserClosetItem = model.define("user_closet_item", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  image_url: model.text(),
  category: model.text(),
  metadata: model.json().nullable(),
  vector_status: model.text().default("pending"),
})

export default UserClosetItem
