import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const isProduction =
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production";

console.log(`[build.mjs] Target environment: ${isProduction ? "Production/PostgreSQL" : "Local/SQLite"}`);

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (isProduction) {
  console.log("[build.mjs] Syncing and generating PostgreSQL schema...");
  run("node", ["scripts/sync-postgres-schema.mjs"]);
  run("npx", ["prisma", "generate", "--schema", "prisma/schema.postgres.prisma"]);
} else {
  console.log("[build.mjs] Generating SQLite schema for local environment...");
  run("npx", ["prisma", "generate", "--schema", "prisma/schema.prisma"]);
}

console.log("[build.mjs] Running Next.js build...");
run("npx", ["next", "build"]);
