import cors from "cors";
import { env } from "./env";

export const corsConfig: cors.CorsOptions = {
  origin:
    env.nodeEnv === "production"
      ? ["https://your-production-domain.com", "https://admin.your-production-domain.com"]
      : true, // allow all in development

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "Accept-Language", "X-Requested-With"],

  exposedHeaders: ["Content-Disposition"],
};
