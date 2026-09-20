import { PAGINATION } from '@kts/config';
import type { Paginated, PaginationMeta } from '@kts/shared-types';

export interface PageRequest {
  page: number;
  pageSize: number;
}

/** Clamps caller-supplied paging values into a safe range. */
export function normalisePaging(input: Partial<PageRequest> | undefined): PageRequest {
  const page = Math.max(1, Math.trunc(Number(input?.page) || PAGINATION.defaultPage));
  const rawSize = Math.trunc(Number(input?.pageSize) || PAGINATION.defaultPageSize);
  const pageSize = Math.min(PAGINATION.maxPageSize, Math.max(1, rawSize));
  return { page, pageSize };
}

export function toSkipTake(request: PageRequest): { skip: number; take: number } {
  return { skip: (request.page - 1) * request.pageSize, take: request.pageSize };
}

export function buildMeta(request: PageRequest, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / request.pageSize);
  return {
    page: request.page,
    pageSize: request.pageSize,
    total,
    totalPages,
    hasNext: request.page < totalPages,
    hasPrevious: request.page > 1 && totalPages > 0,
  };
}

export function paginate<T>(items: T[], request: PageRequest, total: number): Paginated<T> {
  return { items, meta: buildMeta(request, total) };
}

/**
 * Builds a Prisma `orderBy` from caller input, restricted to an allow-list so
 * a crafted query cannot sort by an unindexed or private column.
 */
export function buildOrderBy(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc' | undefined,
  allowed: readonly string[],
  fallback: Record<string, 'asc' | 'desc'>[],
): Record<string, 'asc' | 'desc'>[] {
  if (!sortBy || !allowed.includes(sortBy)) return fallback;
  return [{ [sortBy]: sortDir ?? 'desc' }];
}

/**
 * Case-insensitive contains filter across several columns.
 * Returns undefined when there is nothing to search for.
 */
export function buildSearchWhere(
  search: string | undefined,
  fields: readonly string[],
): { OR: Array<Record<string, { contains: string; mode: 'insensitive' }>> } | undefined {
  const term = search?.trim();
  if (!term || fields.length === 0) return undefined;
  return {
    OR: fields.map((field) => ({ [field]: { contains: term, mode: 'insensitive' as const } })),
  };
}
