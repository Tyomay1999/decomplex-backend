import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import type { UploadedFile } from "express-fileupload";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

function sanitizeSegment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "default";
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "_") || "default";
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function saveUserFileMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const files = req.files;

  if (!files || !files.file) {
    return next();
  }

  const uploaded = Array.isArray(files.file)
    ? (files.file[0] as UploadedFile)
    : (files.file as UploadedFile);

  if (!req.user) {
    throw new AppError("User missing before file upload", { statusCode: 500 });
  }

  const baseDir = path.resolve(process.cwd(), env.staticDir);
  const userId = sanitizeSegment(req.user.id);

  const { scope, bucket } =
    req.user.userType === "company"
      ? {
          scope: sanitizeSegment(req.user.companyId),
          bucket: sanitizeSegment(req.user.position ?? "company-user"),
        }
      : {
          scope: "candidates",
          bucket: "cv",
        };

  const targetDir = path.join(baseDir, scope, bucket, userId);
  ensureDir(targetDir);

  const ext = path.extname(uploaded.name) || ".bin";
  const baseName = path.basename(uploaded.name, ext);
  const safeName = sanitizeSegment(baseName);
  const fileName = `${safeName}-${Date.now()}${ext}`;
  const filePath = path.join(targetDir, fileName);

  try {
    await uploaded.mv(filePath);
  } catch {
    throw new AppError("Failed to save file", {
      statusCode: 500,
    });
  }

  req.fileInfo = {
    fileName,
    path: filePath,
    url: `/static/${scope}/${bucket}/${userId}/${fileName}`,
    size: uploaded.size,
    mimetype: uploaded.mimetype,
    company: scope,
    position: bucket,
    userId,
  };

  return next();
}
