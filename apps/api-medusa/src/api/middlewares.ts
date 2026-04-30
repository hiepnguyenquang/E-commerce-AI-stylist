// src/api/middlewares.ts
import { defineMiddlewares } from "@medusajs/medusa";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/custom/internal/*",
      middlewares: [
        (req, res, next) => {
          const internalToken = req.headers["x-internal-token"];
          const secret = process.env.INTERNAL_API_SECRET;

          if (!internalToken || internalToken !== secret) {
            return res.status(401).json({
              status: "error",
              message: "Unauthorized: Internal access only",
            });
          }
          next();
        },
      ],
    },
  ],
});
