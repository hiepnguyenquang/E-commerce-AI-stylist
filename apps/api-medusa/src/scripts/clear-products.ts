import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, ModuleRegistrationName } from "@medusajs/framework/utils";

export default async function clearProducts({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT);

  logger.info("Fetching all products...");
  
  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
    });

    if (products.length > 0) {
      const productIds = products.map((p: any) => p.id);
      logger.info(`Deleting ${productIds.length} products...`);
      await productModuleService.softDeleteProducts(productIds);
      logger.info("Successfully soft deleted products.");
    } else {
      logger.info("No products found to delete.");
    }
  } catch (error) {
    logger.error("Failed to delete products: ", error);
  }
}
