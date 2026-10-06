const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function createInvitation(email, role = 'admin', expiresInDays = 14) {
  try {
    // Find Staff4dshire Properties company
    const company = await prisma.company.findFirst({
      where: { name: 'Staff4dshire Properties' },
    });

    if (!company) {
      console.error('❌ Company "Staff4dshire Properties" not found');
      process.exit(1);
    }

    // Generate invitation token
    const token = randomBytes(8).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Create invitation
    const invitation = await prisma.companyInvitation.create({
      data: {
        token,
        email,
        role,
        companyId: company.id,
        expiresAt,
      },
    });

    console.log('✓ Invitation created successfully!');
    console.log('  Email:', invitation.email);
    console.log('  Role:', invitation.role);
    console.log('  Token:', invitation.token);
    console.log('  Expires:', invitation.expiresAt.toISOString());
    console.log('\nShare this token with the user or they can request it by email.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and role from command line arguments
const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('Usage: node create-invitation.js <email> [role]');
  console.error('Example: node create-invitation.js ella@staff4dshireproperties.com admin');
  process.exit(1);
}

createInvitation(email, role);
