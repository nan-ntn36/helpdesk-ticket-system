import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../common/errors';
import { CreateUserInput, UpdateUserInput } from './schema';

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  roleId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
};

export async function getUsers(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email already exists');

  const hashedPassword = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: { ...input, password: hashedPassword },
    select: userSelect,
  });
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email already exists');
  }

  return prisma.user.update({
    where: { id },
    data: input,
    select: userSelect,
  });
}
