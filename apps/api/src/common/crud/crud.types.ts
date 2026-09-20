/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContentEntityType } from '@prisma/client';
import type { SessionUserDto } from '@kts/shared-types';
import type { RequestMeta } from '../http/request-context';

/**
 * Minimal structural view of a Prisma model delegate.
 *
 * Prisma generates a distinct, mutually incompatible argument type per model,
 * so the generic CRUD layer works against this shape and each concrete service
 * supplies the correctly typed delegate.
 */
export interface PrismaDelegate {
  findMany(args?: any): Promise<any[]>;
  findFirst(args?: any): Promise<any | null>;
  findUnique(args?: any): Promise<any | null>;
  count(args?: any): Promise<number>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
  delete(args: any): Promise<any>;
}

export interface CrudContext {
  user: SessionUserDto;
  meta: RequestMeta;
}

export interface CrudListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  includeArchived?: boolean;
  [key: string]: unknown;
}

export interface CrudConfig {
  /** URL segment, e.g. `services`. Also used in permission keys. */
  resource: string;
  /** Human label for audit entries, e.g. `Service`. */
  singular: string;
  entityType: ContentEntityType;
  /** Permission family; actions are appended (`services:update`). */
  permissionFamily: string;
  /** Columns searched by the `search` query parameter. */
  searchFields: readonly string[];
  /** Columns a caller may sort by. Anything else falls back to the default. */
  sortFields: readonly string[];
  defaultOrderBy: Array<Record<string, 'asc' | 'desc'>>;
  /** Prisma `include` used for detail reads. */
  include?: any;
  /** Lighter `include` used for list reads. */
  listInclude?: any;
  /** The record carries status / publishedAt / scheduledAt. */
  publishable: boolean;
  /** The record has a unique `slug`. */
  sluggable: boolean;
  /** Public URL prefix, used to propose a 301 when a live slug changes. */
  publicBasePath?: string;
  /** The record has a `sortOrder` column that supports drag reordering. */
  reorderable: boolean;
  /** The record has an optional one-to-one `seo` relation. */
  hasSeo: boolean;
  /** The record has an `archivedAt` column for soft archival. */
  archivable: boolean;
  /** Column name flagging homepage-featured records, if any. */
  featuredField?: string;
  /** Column used as the audit label. */
  labelField: string;
  /** Columns excluded from revision snapshots (heavy or derived). */
  snapshotOmit?: readonly string[];
}

export interface WriteResult<T> {
  data: T;
  /** Redirect proposed because a published slug changed. */
  suggestedRedirect?: { source: string; destination: string } | null;
}
