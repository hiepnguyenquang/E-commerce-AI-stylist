import { model } from "@medusajs/framework/utils"
import { StylistSessionItem } from "./stylist-session-item"

export const StylistSession = model.define("stylist_session", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  prompt: model.text(),
  reasoning: model.text().nullable(),
  status: model.text().default("processing"),
  items: model.hasMany(() => StylistSessionItem, {
    mappedBy: "session",
  })
})
