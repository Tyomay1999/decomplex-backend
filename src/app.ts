import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestIdMiddleware } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { attachMockUserMiddleware } from "./middleware/attachMockUser";
import { saveUserFileMiddleware } from "./middleware/saveUserFile";
import fileUpload from "express-fileupload";

export const app = express();

app.use(helmet());
app.use(cors());
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

app.post("/api", authMiddleware, attachMockUserMiddleware, saveUserFileMiddleware, (_req, res) => {
  res.json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);
