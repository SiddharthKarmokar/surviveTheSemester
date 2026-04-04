import { PrismaClient } from "@prisma/client";

let Prisma;

if (process.env.NODE_ENV === "production") {
  Prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });
  console.log("🗄️  Prisma Client initialized (production mode)");
} else {
  if (!global.prismadb) {
    console.log("🗄️  Creating new Prisma Client instance...");
    global.prismadb = new PrismaClient({
      log: ["error", "warn"],
    });
    console.log("✅ Prisma Client created successfully");
  } else {
    console.log("♻️  Reusing existing Prisma Client instance");
  }
  Prisma = global.prismadb;
}

console.log("📦 Prisma export ready");
export const prisma = Prisma;