import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import dotenv from "dotenv";

const pidFile = path.resolve(__dirname, ".e2e-server.pid");
const projectRoot = path.resolve(__dirname, "..", "..");

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function runShell(command: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", command], {
            stdio: "inherit",
            env: process.env,
            cwd: projectRoot,
          })
        : spawn("sh", ["-lc", command], {
            stdio: "inherit",
            env: process.env,
            cwd: projectRoot,
          });

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command} (${code ?? "null"})`));
    });
  });
}

async function waitForHealth(baseUrl: string, timeoutMs: number): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(250);
  }

  throw new Error(`E2E server is not healthy after ${timeoutMs}ms: ${baseUrl}/health`);
}

function readBoolEnv(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

function loadEnv(): void {
  const dotenvPathRaw = process.env.DOTENV_CONFIG_PATH || ".env.test";
  dotenv.config({ path: path.resolve(projectRoot, dotenvPathRaw) });

  dotenv.config({ path: path.resolve(projectRoot, ".env.e2e") });
}

export default async (): Promise<void> => {
  loadEnv();

  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:4100";
  const useExistingServer = readBoolEnv("E2E_USE_EXISTING_SERVER");

  try {
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  } catch {
    // ignore
  }

  if (useExistingServer) {
    fs.writeFileSync(pidFile, "external", "utf8");
    await waitForHealth(baseUrl, 30000);
    return;
  }

  const distServer = path.resolve(projectRoot, "dist", "server.js");
  if (!fs.existsSync(distServer)) {
    await runShell("npm run build");
  }

  await runShell("node dist/database/runMigrations.js");

  const child = spawn(process.execPath, [distServer], {
    stdio: "inherit",
    env: process.env,
    cwd: projectRoot,
  });

  const pid = child.pid;
  if (!pid) throw new Error("Failed to start server process (no pid)");
  fs.writeFileSync(pidFile, String(pid), "utf8");

  await waitForHealth(baseUrl, 30000);
};
