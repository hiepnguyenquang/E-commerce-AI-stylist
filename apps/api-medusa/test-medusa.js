const { resolve } = require("path");
const { MedusaApp } = require("@medusajs/modules-sdk");

async function run() {
  try {
    const { modules } = await MedusaApp({
      sharedResourcesConfig: {
        database: {
          clientUrl: "postgres://medusa_admin:medusa_password@localhost:5432/medusa_db",
        },
      },
      modulesConfig: {
        aiPersonalization: {
          resolve: resolve("./src/modules/ai-personalization"),
        },
      },
    });

    const aiService = modules.aiPersonalization;
    if (aiService) {
      console.log("Module resolved!");
      const jobs = await aiService.listVtonJobs({}, { take: 1 });
      console.log("Jobs:", jobs.length);
    } else {
      console.log("Module undefined");
    }
  } catch (e) {
    console.error(e);
  }
}
run();