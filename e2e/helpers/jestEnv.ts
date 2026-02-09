import path from "path";
import dotenv from "dotenv";

function readBoolEnv(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

const useExistingServer = readBoolEnv("E2E_USE_EXISTING_SERVER");
const envFile = useExistingServer ? ".env.e2e.docker" : ".env.e2e";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
