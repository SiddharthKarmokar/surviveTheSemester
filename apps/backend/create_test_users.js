import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Cleanup old test users if they exist
  await prisma.users.deleteMany({
    where: { email: { in: ['test1@example.com', 'test2@example.com'] } }
  });

  // Create User 1
  const user1 = await prisma.users.create({
    data: {
      name: 'Test User One',
      email: 'test1@example.com',
      passwordHash,
    }
  });

  // Create User 2
  const user2 = await prisma.users.create({
    data: {
      name: 'Test User Two',
      email: 'test2@example.com',
      passwordHash,
    }
  });

  // Make them friends
  await prisma.users.update({
    where: { id: user1.id },
    data: { friendlist: [user2.id] }
  });

  await prisma.users.update({
    where: { id: user2.id },
    data: { friendlist: [user1.id] }
  });

  console.log('Test users created successfully!');
  console.log('User 1: test1@example.com / password123');
  console.log('User 2: test2@example.com / password123');
}

createTestUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
