import type { Express } from "express";
import { app } from "../../src/app";

export function createTestApp(): Express {
  return app;
}
