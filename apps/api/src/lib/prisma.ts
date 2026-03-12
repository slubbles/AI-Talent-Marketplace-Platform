import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __atmPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__atmPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__atmPrisma = prisma;
}