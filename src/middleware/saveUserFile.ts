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

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function saveUserFileMiddleware(req: Request, res: Response, next: NextFunction) {
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

  const company = sanitizeSegment(req.user.company ?? "company");
  const position = sanitizeSegment(req.user.position ?? "position");
  const userId = sanitizeSegment(req.user.id);

  const targetDir = path.join(baseDir, company, position, userId);
  ensureDir(targetDir);

  const ext = path.extname(uploaded.name) || ".bin";
  const name = path.basename(uploaded.name, ext);
  const fileName = `${name}-${Date.now()}${ext}`;
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
    url: `/static/${company}/${position}/${userId}/${fileName}`,
    size: uploaded.size,
    mimetype: uploaded.mimetype,
    company,
    position,
    userId,
  };

  next();
}
