import { MedusaService } from "@medusajs/framework/utils"
import AiProfile from "./models/ai-profile"
import UserClosetItem from "./models/user-closet-item"
import { StylistSession } from "./models/stylist-session"
import { StylistSessionItem } from "./models/stylist-session-item"
import { VtonJob } from "./models/vton-job"

class AiPersonalizationModuleService extends MedusaService({
  AiProfile,
  UserClosetItem,
  StylistSession,
  StylistSessionItem,
  VtonJob,
}){
}

export default AiPersonalizationModuleService
