import fs from "fs";
import path from "path";

const pidFile = path.resolve(__dirname, ".e2e-server.pid");

export default async (): Promise<void> => {
  if (!fs.existsSync(pidFile)) return;

  const raw = fs.readFileSync(pidFile, "utf8").trim();
  fs.unlinkSync(pidFile);

  const pid = Number(raw);
  if (!Number.isFinite(pid) || pid <= 0) return;

  try {
    process.kill(pid);
  } catch {
    return;
  }
};
