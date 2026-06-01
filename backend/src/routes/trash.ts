import { Router } from 'express';
import { prisma } from '../db';
import type { AuthedRequest } from '../middleware/auth';
import { authMiddleware, effectiveRole } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/** Only admins and superadmins can manage the recycle bin. */
function requireAdmin(req: AuthedRequest, res: any): boolean {
  if (!['admin', 'superadmin'].includes(effectiveRole(req))) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

/** GET /api/trash — list soft-deleted projects and users for this company. */
router.get('/', async (req: AuthedRequest, res) => {
  if (!requireAdmin(req, res)) return;

  const companyId = req.companyId!;

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      where: {
        companyId,
        deletedAt: { not: null },
        ...(req.userRole !== 'superadmin' && { createdByUserId: req.userId! }),
      },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, name: true, address: true, deletedAt: true, category: true },
    }),
    prisma.user.findMany({
      where: {
        companyId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, deletedAt: true },
    }),
  ]);

  res.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address ?? undefined,
      category: p.category ?? undefined,
      deleted_at: p.deletedAt!.toISOString(),
    })),
    users: users.map((u) => ({
      id: u.id,
      first_name: u.firstName,
      last_name: u.lastName,
      email: u.email,
      role: u.role,
      deleted_at: u.deletedAt!.toISOString(),
    })),
  });
});

/** PUT /api/trash/projects/:id/restore */
router.put('/projects/:id/restore', async (req: AuthedRequest, res) => {
  if (!requireAdmin(req, res)) return;

  const p = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!p || p.deletedAt == null) return res.status(404).json({ error: 'Not found in trash' });
  if (req.userRole !== 'superadmin' && p.companyId !== req.companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.project.update({ where: { id: p.id }, data: { deletedAt: null } });
  res.json({ ok: true });
});

/** PUT /api/trash/users/:id/restore */
router.put('/users/:id/restore', async (req: AuthedRequest, res) => {
  if (!requireAdmin(req, res)) return;

  const u = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!u || u.deletedAt == null) return res.status(404).json({ error: 'Not found in trash' });
  if (req.userRole !== 'superadmin' && u.companyId !== req.companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.user.update({ where: { id: u.id }, data: { deletedAt: null } });
  res.json({ ok: true });
});

export default router;
