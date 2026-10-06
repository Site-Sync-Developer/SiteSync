const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('Users in database:');
    console.log('─'.repeat(80));
    users.forEach((u) => {
      console.log(`Email: ${u.email}`);
      console.log(`Name: ${u.firstName} ${u.lastName}`);
      console.log(`Role: ${u.role}`);
      console.log('─'.repeat(80));
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
