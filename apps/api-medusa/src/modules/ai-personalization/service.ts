import { MedusaService } from "@medusajs/framework/utils"
import AiProfile from "./models/ai-profile"
import UserClosetItem from "./models/user-closet-item"
import { StylistSession } from "./models/stylist-session"
import { StylistSessionItem } from "./models/stylist-session-item"

class AiPersonalizationModuleService extends MedusaService({
  AiProfile,
  UserClosetItem,
  StylistSession,
  StylistSessionItem,
}){
}

export default AiPersonalizationModuleService
