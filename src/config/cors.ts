import cors from "cors";

const PROD_ORIGINS = [
  "https://decomplex.com",
  "https://admin.decomplex.com",

  "https://tyomay.dev",
  "https://decomplex.tyomay.dev",
  "https://decomplex-admin.tyomay.dev",
  "https://decomplex-web.tyomay.dev",
  "https://decomplex-mobile.tyomay.dev",
  "https://decomplex-api.tyomay.dev",
  "https://tyomay1999.github.io",
];

export const corsConfig: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (PROD_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
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
};
