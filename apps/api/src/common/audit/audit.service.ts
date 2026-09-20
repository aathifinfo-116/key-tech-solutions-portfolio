import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction, ContentEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestMeta } from '../http/request-context';

export interface AuditEntry {
  action: AuditAction;
  entityType: ContentEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  actor?: { id: string; email: string } | null;
  meta?: Partial<RequestMeta>;
}

/**
 * Append-only audit trail.
 *
 * Audit writes never fail a request: if the log insert throws, the error is
 * reported to the application log and the caller carries on. Field values that
 * could contain secrets are redacted before they are stored.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          entityLabel: entry.entityLabel?.slice(0, 300) ?? null,
          summary: entry.summary?.slice(0, 1000) ?? null,
          metadata: entry.metadata ? (redact(entry.metadata) as object) : undefined,
          actorId: entry.actor?.id ?? null,
          actorEmail: entry.actor?.email ?? null,
          ipAddress: entry.meta?.ipAddress ?? null,
          userAgent: entry.meta?.userAgent ?? null,
          requestId: entry.meta?.requestId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for ${entry.action} ${entry.entityType}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Convenience wrapper used by the generic CRUD layer. */
  async recordChange(params: {
    action: AuditAction;
    entityType: ContentEntityType;
    entityId: string;
    label: string;
    actor?: { id: string; email: string } | null;
    meta?: Partial<RequestMeta>;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  }): Promise<void> {
    const changed =
      params.before && params.after ? diffKeys(params.before, params.after) : undefined;
    await this.record({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.label,
      summary: changed?.length ? `Changed: ${changed.join(', ')}` : undefined,
      metadata: changed?.length ? { changedFields: changed } : undefined,
      actor: params.actor,
      meta: params.meta,
    });
  }
}

/**
 * Substrings, not exact names: `resetToken`, `refresh_token` and
 * `SESSION_ID` must all be caught, not just the exact spellings we thought of.
 */
const SENSITIVE_FRAGMENTS = [
  'password',
  'token',
  'secret',
  'apikey',
  'accesskey',
  'privatekey',
  'authorization',
  'cookie',
  'sessionid',
  'credential',
  'databaseurl',
  'connectionstring',
];

/** Replaces anything that looks like a credential with a marker. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[depth-limit]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const normalised = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      output[key] = SENSITIVE_FRAGMENTS.some((fragment) => normalised.includes(fragment))
        ? '[redacted]'
        : redact(item, depth + 1);
    }
    return output;
  }
  return value;
}

/** Names the top-level fields whose values differ. Values are not recorded. */
export function diffKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (key === 'updatedAt' || key === 'version') continue;
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
      changed.push(key);
  }
  return changed.sort();
}
