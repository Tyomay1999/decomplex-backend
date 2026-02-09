import express from "express";
import cors from "cors";
import path from "path";
import fileUpload from "express-fileupload";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { corsConfig } from "./config/cors";
import { swaggerSpec } from "./config/swagger";

import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { securityHeadersMiddleware } from "./middleware/security";
import { localeMiddleware } from "./middleware/locale";
import { fingerprintMiddleware } from "./middleware/fingerprint";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { instanceHeaderMiddleware } from "./middleware/instanceHeader";
import { errorHandler } from "./middleware/errorHandler";

import { apiRouter } from "./routes";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use(cors(corsConfig));

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    fileUpload({
      limits: { fileSize: env.uploadMaxFileSizeMb * 1024 * 1024 },
      abortOnLimit: true,
      useTempFiles: false,
    }),
  );

  const staticRoot = path.resolve(process.cwd(), env.staticDir);
  app.use("/static", express.static(staticRoot));

  app.use(requestIdMiddleware);
  app.use(requestLogger);

  app.use(securityHeadersMiddleware);
  app.use(localeMiddleware);
  app.use(fingerprintMiddleware);
  app.use(instanceHeaderMiddleware);

  if (env.nodeEnv !== "production") {
    app.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
      }),
    );
  }

  app.use("/api", apiRouter);

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
