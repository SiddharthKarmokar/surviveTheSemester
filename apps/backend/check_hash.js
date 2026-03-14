import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function checkLogin() {
  try {
    const hashedPassword = await bcrypt.hash('1234567890', 10);
    await prisma.users.update({
        where: { email: 'laxmigarg1005@gmail.com' },
        data: { passwordHash: hashedPassword }
    });
    console.log("Password manually reset to 1234567890 for laxmigarg1005@gmail.com");
  } catch (err) {
    console.error("Test script error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
checkLogin();
