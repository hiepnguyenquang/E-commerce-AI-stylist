import { model } from "@medusajs/framework/utils"
import { StylistSession } from "./stylist-session"

export const StylistSessionItem = model.define("stylist_session_item", {
  id: model.id().primaryKey(),
  session: model.belongsTo(() => StylistSession, {
    mappedBy: "items",
  }),
  product_id: model.text(),
  replaces_item_id: model.text().nullable(),
})
