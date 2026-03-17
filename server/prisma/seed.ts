import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ──────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'System administrator with full access' },
    }),
    prisma.role.upsert({
      where: { name: 'AGENT' },
      update: {},
      create: { name: 'AGENT', description: 'Support agent who handles tickets' },
    }),
    prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER', description: 'Regular user who creates tickets' },
    }),
  ]);

  const [adminRole, agentRole, userRole] = roles;
  console.log(`✅ Roles: ${roles.map(r => r.name).join(', ')}`);

  // ─── Permissions ────────────────────────────────────────
  const permissionNames = [
    // Ticket permissions
    'ticket.create',
    'ticket.read.own',
    'ticket.read.assigned',
    'ticket.read.all',
    'ticket.update.own',
    'ticket.update.assigned',
    'ticket.update.all',
    'ticket.delete',
    'ticket.assign',
    'ticket.change-status',

    // Comment permissions
    'comment.create',
    'comment.read',

    // User management
    'user.read',
    'user.create',
    'user.update',
    'user.deactivate',

    // Category management
    'category.read',
    'category.create',
    'category.update',
    'category.delete',

    // Dashboard
    'dashboard.view',

    // Attachment
    'attachment.upload',
    'attachment.download',
  ];

  const permissions = await Promise.all(
    permissionNames.map(name =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  console.log(`✅ Permissions: ${permissions.length} created`);

  // ─── Role-Permission Mapping ────────────────────────────
  const permMap = Object.fromEntries(permissions.map(p => [p.name, p.id]));

  const adminPermissions = permissionNames; // Admin gets all
  const agentPermissions = [
    'ticket.create',
    'ticket.read.own',
    'ticket.read.assigned',
    'ticket.read.all',
    'ticket.update.assigned',
    'ticket.change-status',
    'comment.create',
    'comment.read',
    'category.read',
    'dashboard.view',
    'attachment.upload',
    'attachment.download',
  ];
  const userPermissions = [
    'ticket.create',
    'ticket.read.own',
    'ticket.update.own',
    'comment.create',
    'comment.read',
    'category.read',
    'attachment.upload',
    'attachment.download',
  ];

  // Clear existing role-permissions to avoid duplicates
  await prisma.rolePermission.deleteMany({});

  const rolePermissionData = [
    ...adminPermissions.map(p => ({ roleId: adminRole.id, permissionId: permMap[p] })),
    ...agentPermissions.map(p => ({ roleId: agentRole.id, permissionId: permMap[p] })),
    ...userPermissions.map(p => ({ roleId: userRole.id, permissionId: permMap[p] })),
  ];

  await prisma.rolePermission.createMany({ data: rolePermissionData });
  console.log(`✅ Role-Permissions: ${rolePermissionData.length} mappings`);

  // ─── Admin Account ──────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@helpdesk.com',
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log(`✅ Admin: ${admin.email} (password: admin123)`);

  // ─── Default Categories ─────────────────────────────────
  const categoryNames = [
    'General',
    'Technical Support',
    'Billing',
    'Account',
    'Bug Report',
    'Feature Request',
  ];

  const categories = await Promise.all(
    categoryNames.map(name =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  console.log(`✅ Categories: ${categories.map(c => c.name).join(', ')}`);

  console.log('\n🎉 Seeding completed!');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
