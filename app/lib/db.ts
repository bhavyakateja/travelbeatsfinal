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

  const adapter = new PrismaPg({
    connectionString,

    // Each serverless function instance gets its own pool via this
    // module-level singleton. If `max` is left at pg's default (10) and
    // your platform scales out to, say, 20 concurrent instances under
    // load, that's up to 200 connections hitting Postgres at once — most
    // managed Postgres plans cap far below that. Keep the per-instance
    // pool small; if you're on a pooler-fronted connection string
    // (PgBouncer, Supabase's pooled URL, Neon's pooled endpoint) this can
    // go a bit higher, but there's rarely a reason to exceed single
    // digits per instance.
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),

    // How long to wait for a connection to establish before giving up.
    // pg has no timeout by default, which means a slow/unreachable DB can
    // hang a query indefinitely instead of failing fast. This works
    // alongside (not instead of) the query-level timeout in lib/content.ts
    // — that one bounds how long a query is allowed to run once
    // connected, this one bounds how long connecting itself is allowed
    // to take.
    connectionTimeoutMillis: 10_000,

    // Recycle idle connections instead of holding them open indefinitely
    // — keeps the pool from accumulating stale connections across a long
    // warm serverless instance lifetime.
    idleTimeoutMillis: 30_000,
  });

  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}