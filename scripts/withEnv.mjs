import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

function pickArg(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const value = args[idx + 1] ?? null;
  args.splice(idx, 2);
  return value;
}

function resolveBin(cmd) {
  const looksLikePath =
    cmd.includes("/") ||
    cmd.includes("\\") ||
    cmd.endsWith(".js") ||
    cmd.endsWith(".cjs") ||
    cmd.endsWith(".mjs");

  if (looksLikePath) return cmd;

  const binDir = path.resolve(process.cwd(), "node_modules", ".bin");

  if (process.platform === "win32") {
    const win = path.join(binDir, `${cmd}.cmd`);
    if (existsSync(win)) return win;
  }

  const nix = path.join(binDir, cmd);
  if (existsSync(nix)) return nix;

  return cmd;
}

function shellQuoteWin(arg) {
  const s = String(arg);
  const escaped = s.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function readBoolEnv(name) {
  const v = process.env[name];
  if (!v) return false;
  const s = String(v).toLowerCase();
  return v === "1" || s === "true" || s === "yes";
}

function inE2eDockerMode() {
  return (
    readBoolEnv("E2E_USE_EXISTING_SERVER") ||
    String(process.env.E2E_MODE || "").toLowerCase() === "docker"
  );
}

function hardDisableInfraForHostE2e() {
  process.env.REDIS_ENABLED = "false";
  delete process.env.REDIS_URL;

  process.env.RABBITMQ_ENABLED = "false";
  delete process.env.RABBITMQ_URL;
  delete process.env.RABBITMQ_EMAIL_QUEUE;
}

const argv = process.argv.slice(2);

const envFile = pickArg(argv, "--env-file");
const nodeEnv = pickArg(argv, "--node-env");

const dd = argv.indexOf("--");
const cmdParts = dd === -1 ? argv : argv.slice(dd + 1);

if (!cmdParts.length) {
  console.error(
    "withEnv: missing command. Example: node scripts/withEnv.mjs --env-file .env.test --node-env test -- jest",
  );
  process.exit(1);
}

if (envFile) {
  const abs = path.resolve(process.cwd(), envFile);
  if (!existsSync(abs)) {
    console.error(`withEnv: env file not found: ${envFile}`);
    process.exit(1);
  }
  dotenv.config({ path: abs, override: false });
}

if (nodeEnv) process.env.NODE_ENV = nodeEnv;
process.env.DOTENV_CONFIG_QUIET = "true";

if (inE2eDockerMode()) {
  hardDisableInfraForHostE2e();
}

const [cmd, ...args] = cmdParts;
const resolved = resolveBin(cmd);

const isWinCmd = process.platform === "win32" && resolved.endsWith(".cmd");

const child = isWinCmd
  ? spawn(
      `${shellQuoteWin(resolved)}${args.length ? " " : ""}${args.map(shellQuoteWin).join(" ")}`,
      { stdio: "inherit", env: process.env, shell: true },
    )
  : spawn(resolved, args, { stdio: "inherit", env: process.env, shell: false });

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
