import cors from "cors";
import { env } from "./env";

export const corsConfig: cors.CorsOptions = {
  origin:
    env.nodeEnv === "production" ? ["https://decomplex.com", "https://admin.decomplex.com"] : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept-Language",
    "X-Requested-With",
    "X-Client-Fingerprint",
    "X-Fingerprint",
  ],
  exposedHeaders: ["Content-Disposition"],
};
