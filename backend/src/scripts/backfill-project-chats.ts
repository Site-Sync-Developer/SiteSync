import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, companyId: true },
  });

  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const existing = await prisma.conversation.findFirst({
      where: { projectId: project.id, type: 'project_group' },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const companyUsers = await prisma.user.findMany({
      where: { companyId: project.companyId, isActive: true },
      select: { id: true },
    });

    await prisma.conversation.create({
      data: {
        companyId: project.companyId,
        projectId: project.id,
        type: 'project_group',
        name: project.name,
        participants: { create: companyUsers.map((u) => ({ userId: u.id })) },
      },
    });

    console.log(`Created group chat for project: ${project.name}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, already had chat: ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
