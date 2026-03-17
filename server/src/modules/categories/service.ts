import { prisma } from '../../lib/prisma';
import { ConflictError } from '../../common/errors';
import { CreateCategoryInput } from './schema';

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError('Category already exists');

  return prisma.category.create({ data: input });
}
