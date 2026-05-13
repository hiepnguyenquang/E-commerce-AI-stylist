import AiPersonalizationModuleService from "./service"
import { Module } from "@medusajs/framework/utils"
import visionConsumerLoader from "./loaders/vision-consumer"

export const AI_PERSONALIZATION_MODULE = "aiPersonalization"

export default Module(AI_PERSONALIZATION_MODULE, {
  service: AiPersonalizationModuleService,
  loaders: [visionConsumerLoader],
})
