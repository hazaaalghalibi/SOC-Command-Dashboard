/**
 * Runs Vite + API in parallel (avoids Windows/cmd issues with nested npm + concurrently).
 */
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** Repo root (not process.cwd()), so this works when started from server/ via npm run dev:full */
const repoRoot = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));

const isWin = process.platform === "win32";

function runDevFull() {
  let exiting = false;
  /** @type {import('child_process').ChildProcess | undefined} */
  let web;
  /** @type {import('child_process').ChildProcess | undefined} */
  let api;

  const shutdown = (code) => {
    if (exiting) return;
    exiting = true;
    try {
      web?.kill(isWin ? undefined : "SIGTERM");
    } catch {
      /* ignore */
    }
    try {
      api?.kill(isWin ? undefined : "SIGTERM");
    } catch {
      /* ignore */
    }
    process.exit(typeof code === "number" ? code : 0);
  };

  const spawnNpm = (args, label) => {
    /** @type {import('child_process').SpawnOptions} */
    const opts = {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    };

    let child;
    if (isWin) {
      const shell = process.env.ComSpec || "cmd.exe";
      const line = ["npm", ...args]
        .map((a) => (/\s/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))
        .join(" ");
      child = spawn(shell, ["/d", "/s", "/c", line], opts);
    } else {
      child = spawn("npm", args, opts);
    }

    child.on("error", (err) => {
      console.error(`[${label}]`, err);
      shutdown(1);
    });
    return child;
  };

  web = spawnNpm(["run", "dev"], "web");
  api = spawnNpm(["run", "dev", "--prefix", "server"], "api");

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  const onChildExit = (which) => (code, signal) => {
    if (exiting) return;
    if (signal) {
      shutdown(0);
      return;
    }
    if (code !== 0 && code !== null) {
      console.error(`[${which}] exited with code ${code}`);
    }
    shutdown(code ?? 0);
  };

  web.on("exit", onChildExit("web"));
  api.on("exit", onChildExit("api"));
}

runDevFull();
