/**
 * Publication workflow rules.
 *
 * One place decides what "published" means, so the API filters, the sitemap,
 * navigation, related-content blocks and the preview route can never disagree.
 */

import type { PublicationStatus } from '@kts/shared-types';

export interface PublishableRecord {
  status: PublicationStatus;
  publishedAt?: Date | string | null;
  scheduledAt?: Date | string | null;
  archivedAt?: Date | string | null;
}

const ALLOWED_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  DRAFT: ['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  REVIEW: ['REVIEW', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'],
  SCHEDULED: ['SCHEDULED', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED'],
  ARCHIVED: ['ARCHIVED', 'DRAFT'],
};

export function canTransition(from: PublicationStatus, to: PublicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionError(from: PublicationStatus, to: PublicationStatus): string {
  return `Cannot move content from ${from} to ${to}. Allowed next states: ${ALLOWED_TRANSITIONS[from].join(', ')}.`;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * True when the record should be visible to anonymous visitors right now.
 * SCHEDULED content becomes visible once its scheduled time has passed.
 */
export function isPubliclyVisible(record: PublishableRecord, now: Date = new Date()): boolean {
  if (toDate(record.archivedAt)) return false;

  if (record.status === 'PUBLISHED') {
    const publishedAt = toDate(record.publishedAt);
    return publishedAt === null || publishedAt <= now;
  }

  if (record.status === 'SCHEDULED') {
    const scheduledAt = toDate(record.scheduledAt);
    return scheduledAt !== null && scheduledAt <= now;
  }

  return false;
}

/** Records in these states may appear in the sitemap once they are visible. */
export function isSitemapEligible(record: PublishableRecord, now: Date = new Date()): boolean {
  return isPubliclyVisible(record, now);
}

export interface StatusChangeInput {
  currentStatus: PublicationStatus;
  nextStatus: PublicationStatus;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string | null;
  now?: Date;
}

export interface StatusChangeResult {
  ok: boolean;
  error?: string;
  patch?: {
    status: PublicationStatus;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    archivedAt: Date | null;
  };
}

/**
 * Validates a workflow transition and returns the exact field values to write.
 * Publishing stamps `publishedAt` once and keeps the original date afterwards.
 */
export function resolveStatusChange(input: StatusChangeInput): StatusChangeResult {
  const now = input.now ?? new Date();
  const { currentStatus, nextStatus } = input;

  if (!canTransition(currentStatus, nextStatus)) {
    return { ok: false, error: transitionError(currentStatus, nextStatus) };
  }

  const existingPublishedAt = toDate(input.publishedAt);
  const scheduledAt = toDate(input.scheduledAt);

  switch (nextStatus) {
    case 'PUBLISHED':
      return {
        ok: true,
        patch: {
          status: 'PUBLISHED',
          publishedAt: existingPublishedAt ?? now,
          scheduledAt: null,
          archivedAt: null,
        },
      };

    case 'SCHEDULED': {
      if (!scheduledAt) {
        return { ok: false, error: 'A scheduled publication date and time is required.' };
      }
      if (scheduledAt <= now) {
        return { ok: false, error: 'The scheduled publication time must be in the future.' };
      }
      return {
        ok: true,
        patch: {
          status: 'SCHEDULED',
          publishedAt: existingPublishedAt,
          scheduledAt,
          archivedAt: null,
        },
      };
    }

    case 'ARCHIVED':
      return {
        ok: true,
        patch: {
          status: 'ARCHIVED',
          publishedAt: existingPublishedAt,
          scheduledAt: null,
          archivedAt: now,
        },
      };

    case 'DRAFT':
    case 'REVIEW':
      return {
        ok: true,
        patch: {
          status: nextStatus,
          publishedAt: existingPublishedAt,
          scheduledAt: null,
          archivedAt: null,
        },
      };

    default:
      return { ok: false, error: `Unsupported status ${nextStatus}.` };
  }
}

/** Prisma-compatible `where` fragment selecting publicly visible records. */
export function publicVisibilityWhere(now: Date = new Date()) {
  return {
    archivedAt: null,
    OR: [
      { status: 'PUBLISHED' as const, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: now } },
    ],
  };
}
