import { defineMiddlewares } from "@medusajs/medusa";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Ensure upload directory exists in .medusa (hidden from watcher)
const uploadDir = path.join(process.cwd(), ".medusa", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Middleware xử lý CORS cho các route /v1/
const corsMiddleware = (req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-customer-id");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
};

export default defineMiddlewares({
  routes: [
    {
      matcher: "/v1/*",
      middlewares: [corsMiddleware],
    },
    {
      matcher: "/uploads/*",
      middlewares: [
        // Serve static files from the hidden .medusa/uploads folder
        express.static(path.join(process.cwd(), ".medusa", "uploads"))
      ],
    },
    {
      matcher: "/custom/internal/*",
      middlewares: [
        (req: any, res: any, next: any) => {
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
    {
      matcher: "/v1/ai-profile",
      method: "POST",
      middlewares: [upload.single("human_image") as any],
    },
    {
      matcher: "/v1/user/garments",
      method: "POST",
      middlewares: [upload.single("garment_image") as any],
    },
  ],
});
