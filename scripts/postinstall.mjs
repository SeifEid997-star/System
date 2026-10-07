import { spawnSync } from "node:child_process";

const isProduction =
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production";

console.log(`[postinstall.mjs] Target environment: ${isProduction ? "Production/PostgreSQL" : "Local/SQLite"}`);

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
  console.log("[postinstall.mjs] Generating Prisma Client for PostgreSQL...");
  run("node", ["scripts/sync-postgres-schema.mjs"]);
  run("npx", ["prisma", "generate", "--schema", "prisma/schema.postgres.prisma"]);
} else {
  console.log("[postinstall.mjs] Generating Prisma Client for SQLite...");
  run("npx", ["prisma", "generate", "--schema", "prisma/schema.prisma"]);
}
