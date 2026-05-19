import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client. Imported across the app so all queries share a
 * single connection pool. Instantiated once at process start.
 */
export const prisma = new PrismaClient();
