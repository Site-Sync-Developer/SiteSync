const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSuperadminEmail(newEmail) {
  try {
    // Find the current superadmin
    const superadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' },
    });

    if (!superadmin) {
      console.error('❌ No superadmin found');
      process.exit(1);
    }

    // Update the email
    const updated = await prisma.user.update({
      where: { id: superadmin.id },
      data: { email: newEmail },
    });

    console.log('✓ Superadmin email updated successfully!');
    console.log('  Old email:', superadmin.email);
    console.log('  New email:', updated.email);
    console.log('  Name:', updated.firstName, updated.lastName);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const newEmail = process.argv[2];

if (!newEmail) {
  console.error('Usage: node update-superadmin-email.js <new-email>');
  console.error('Example: node update-superadmin-email.js tom@staff4dshireproperties.com');
  process.exit(1);
}

updateSuperadminEmail(newEmail);
