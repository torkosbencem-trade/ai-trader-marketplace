#!/usr/bin/env node
// Driver for the ai-trader-marketplace (StrataOS) Next.js web app.
//
// It reaches into the RUNNING app two ways:
//   - HTTP route assertions (fetch) — proves the public surface + the
//     next.config redirects that park the old marketplace routes.
//   - Headless-Chromium screenshots — visual proof the reframed landing renders.
//
// Commands:
//   node driver.mjs e2e                 launch `next start`, smoke + screenshot, tear down
//   node driver.mjs smoke [baseUrl]     assert routes against an already-running server
//   node driver.mjs shot <url> <out>    screenshot one URL via headless Chromium
//
// Requires a prior `npm run build` (uses .next). Node 18+ (global fetch).

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SKILL_DIR, "../../..");
const NEXT_BIN = path.join(REPO_ROOT, "node_modules", "next", "dist", "bin", "next");
const SHOT_DIR = path.join(SKILL_DIR, "screenshots");
const PORT = Number(process.env.PORT || 3100);
const BASE = `http://localhost:${PORT}`;

// Public surface verified this session. [path, expectedStatus, redirectsTo?]
const ROUTES = [
  ["/", 200],
  ["/stress-test", 200],
  ["/parked", 200],
  ["/login", 200],
  ["/auth", 200],
  ["/marketplace", 307, "/parked"],
  ["/admin/risk", 307, "/parked"],
  ["/portfolio", 307, "/parked"],
  ["/pricing", 307, "/parked"],
  ["/demo", 307, "/parked"],
  ["/no-such-page-xyz", 404],
];

const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

function findBrowser() {
  const found = BROWSERS.find((p) => existsSync(p));
  if (!found) throw new Error("No headless Chromium (Edge/Chrome) found. Edit BROWSERS in driver.mjs.");
  return found;
}

async function status(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return { status: res.status, location: res.headers.get("location") };
  } catch (err) {
    return { status: 0, location: null, error: String(err) };
  }
}

async function waitForReady(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await status(`${BASE}/`);
    if (r.status === 200) return true;
    await new Promise((r) => setTimeout(r, 700));
  }
  return false;
}

async function smoke(base = BASE) {
  let failures = 0;
  console.log(`\nRoute assertions against ${base}`);
  console.log("-".repeat(60));
  for (const [route, expected, redirectTo] of ROUTES) {
    const r = await status(`${base}${route}`);
    let ok = r.status === expected;
    if (ok && redirectTo) ok = (r.location || "").endsWith(redirectTo);
    const detail = redirectTo ? ` -> ${r.location ?? "(none)"}` : "";
    console.log(`${ok ? "PASS" : "FAIL"}  ${route.padEnd(20)} ${r.status}${detail}`);
    if (!ok) failures++;
  }
  console.log("-".repeat(60));
  console.log(`${ROUTES.length - failures}/${ROUTES.length} passed`);
  return failures;
}

function shot(url, outFile) {
  const browser = findBrowser();
  mkdirSync(path.dirname(outFile), { recursive: true });
  const userDataDir = path.join(os.tmpdir(), `strataos-shot-${Date.now()}`);
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${userDataDir}`,
    "--window-size=1280,2200",
    `--screenshot=${outFile}`,
    url,
  ];
  const res = spawnSync(browser, args, { stdio: "ignore", timeout: 60000 });
  if (res.error) throw res.error;
  if (!existsSync(outFile) || statSync(outFile).size === 0) {
    throw new Error(`Screenshot not written or empty: ${outFile}`);
  }
  console.log(`shot  ${url} -> ${outFile} (${statSync(outFile).size} bytes)`);
}

function startServer() {
  console.log(`Starting: next start -p ${PORT}`);
  return spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
}

function stopServer(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

async function e2e() {
  if (!existsSync(path.join(REPO_ROOT, ".next"))) {
    throw new Error("No .next build found. Run `npm run build` first.");
  }
  const server = startServer();
  let failures = 1;
  try {
    if (!(await waitForReady())) throw new Error("Server never became ready on " + BASE);
    console.log("Server ready.");
    failures = await smoke();
    shot(`${BASE}/`, path.join(SHOT_DIR, "landing.png"));
    shot(`${BASE}/parked`, path.join(SHOT_DIR, "parked.png"));
  } finally {
    stopServer(server);
    console.log("Server stopped.");
  }
  return failures;
}

const [cmd, a, b] = process.argv.slice(2);
try {
  if (cmd === "smoke") {
    process.exit((await smoke(a || BASE)) === 0 ? 0 : 1);
  } else if (cmd === "shot") {
    if (!a || !b) throw new Error("usage: node driver.mjs shot <url> <outFile>");
    shot(a, path.resolve(b));
    process.exit(0);
  } else if (cmd === "e2e" || cmd === undefined) {
    process.exit((await e2e()) === 0 ? 0 : 1);
  } else {
    console.error(`Unknown command: ${cmd}\nUse: e2e | smoke [baseUrl] | shot <url> <out>`);
    process.exit(2);
  }
} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
