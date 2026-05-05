import { MedusaService } from "@medusajs/framework/utils"
import AiProfile from "./models/ai-profile"
import UserClosetItem from "./models/user-closet-item"

class AiPersonalizationModuleService extends MedusaService({
  AiProfile,
  UserClosetItem,
}){
}

export default AiPersonalizationModuleService
