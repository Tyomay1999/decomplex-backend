import cors from "cors";

const PROD_ORIGINS = [
  "https://decomplex.com",
  "https://admin.decomplex.com",
  "http://localhost:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3100",
  "http://192.168.1.170:3000",
  "http://localhost:8081",
  "http://192.168.1.170:8081",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://192.168.1.170:4173",
  "http://localhost:5173",
  "http://192.168.1.170:5173",
  "http://localhost:4000",

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
