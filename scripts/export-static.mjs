import { cpSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const tmp = path.join(os.tmpdir(), "ai-kitchen-secretary-static");
const outDest = path.join(root, "out");

function shouldCopy(src) {
  const rel = path.relative(root, src).replace(/\\/g, "/");
  if (!rel || rel === ".") return true;
  if (rel.startsWith("node_modules")) return false;
  if (rel.startsWith(".next")) return false;
  if (rel.startsWith("out")) return false;
  if (rel.startsWith("src/app/api")) return false;
  if (rel === "src/instrumentation.ts") return false;
  if (rel.startsWith(".git")) return false;
  if (rel.startsWith(".vercel")) return false;
  return true;
}

rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
cpSync(root, tmp, { recursive: true, filter: shouldCopy });
cpSync(path.join(root, "node_modules"), path.join(tmp, "node_modules"), {
  recursive: true,
});

const result = spawnSync("npx", ["next", "build"], {
  cwd: tmp,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, STATIC_EXPORT: "1" },
});

if (result.status !== 0) {
  rmSync(tmp, { recursive: true, force: true });
  process.exit(result.status ?? 1);
}

rmSync(outDest, { recursive: true, force: true });
cpSync(path.join(tmp, "out"), outDest, { recursive: true });
cpSync(path.join(outDest, "index.html"), path.join(outDest, "200.html"));
rmSync(tmp, { recursive: true, force: true });
