import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../prisma/schema.prisma", import.meta.url);
const targetPath = new URL("../prisma/schema.postgres.prisma", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const sqliteDatasource = /datasource db\s*\{\s*provider\s*=\s*"sqlite"\s*\r?\n\s*url\s*=\s*"file:\.\/dev\.db"\s*\r?\n\}/;

if (!sqliteDatasource.test(source)) {
  throw new Error("Could not find the expected SQLite datasource block in prisma/schema.prisma");
}

const postgresDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;
await writeFile(targetPath, source.replace(sqliteDatasource, postgresDatasource), "utf8");
console.log("Generated prisma/schema.postgres.prisma from the shared SQLite model definitions.");
