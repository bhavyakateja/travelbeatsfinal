import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations when DATABASE_URL points to a pooler.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
