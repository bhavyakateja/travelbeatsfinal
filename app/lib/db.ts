import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
// Prisma's JavaScript entrypoint and its adjacent declaration file are
// regenerated together. Importing it explicitly avoids TypeScript selecting a
// stale generated `client.ts` file from an earlier schema.
import { PrismaClient } from "@/app/generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}
