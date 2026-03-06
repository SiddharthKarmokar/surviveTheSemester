import { PrismaClient } from "@prisma/client";

let Prisma;

if (process.env.NODE_ENV === "production") {
  Prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });
} else {
  if (!global.prismadb) {
    global.prismadb = new PrismaClient();
  }
  Prisma = global.prismadb;
}

export const prisma = Prisma;