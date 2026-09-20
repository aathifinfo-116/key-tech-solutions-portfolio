/**
 * Editorial SEO checks.
 *
 * These drive the admin "SEO health" screen. The score is an internal
 * editorial completeness score derived from this checklist. It is not, and
 * cannot predict, any search engine ranking.
 */

import { SEO_LIMITS } from '@kts/config';
import type { ContentEntityType, SeoIssueDto } from '@kts/shared-types';

export interface AuditableEntity {
  entityType: ContentEntityType;
  entityId: string;
  label: string;
  adminPath: string;
  publicPath: string | null;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  includeInSitemap: boolean;
  h1: string | null;
  /** Images rendered on the page, used for the alt-text check. */
  images: Array<{ url: string; altText: string | null }>;
  slug: string | null;
  /** Ids of related records that no longer resolve. */
  brokenRelationIds: string[];
  /** True when nothing else on the site links to this page. */
  isOrphan: boolean;
}

type Severity = SeoIssueDto['severity'];

function issue(
  entity: AuditableEntity,
  severity: Severity,
  code: string,
  message: string,
): SeoIssueDto {
  return {
    severity,
    code,
    message,
    entityType: entity.entityType,
    entityId: entity.entityId,
    entityLabel: entity.label,
    adminPath: entity.adminPath,
  };
}

export function auditEntity(
  entity: AuditableEntity,
  duplicateSlugs: Set<string> = new Set(),
): SeoIssueDto[] {
  const issues: SeoIssueDto[] = [];

  const title = entity.seoTitle?.trim() ?? '';
  if (!title) {
    issues.push(
      issue(entity, 'error', 'missing-title', 'No SEO title. The page falls back to its heading.'),
    );
  } else {
    if (title.length < SEO_LIMITS.titleMin) {
      issues.push(
        issue(
          entity,
          'warning',
          'title-too-short',
          `SEO title is ${title.length} characters; aim for ${SEO_LIMITS.titleMin}-${SEO_LIMITS.titleIdealMax}.`,
        ),
      );
    }
    if (title.length > SEO_LIMITS.titleHardMax) {
      issues.push(
        issue(
          entity,
          'warning',
          'title-too-long',
          `SEO title is ${title.length} characters and will be truncated in results.`,
        ),
      );
    }
  }

  const description = entity.seoDescription?.trim() ?? '';
  if (!description) {
    issues.push(issue(entity, 'error', 'missing-description', 'No meta description.'));
  } else {
    if (description.length < SEO_LIMITS.descriptionMin) {
      issues.push(
        issue(
          entity,
          'info',
          'description-too-short',
          `Meta description is ${description.length} characters; aim for ${SEO_LIMITS.descriptionMin}-${SEO_LIMITS.descriptionIdealMax}.`,
        ),
      );
    }
    if (description.length > SEO_LIMITS.descriptionHardMax) {
      issues.push(
        issue(
          entity,
          'warning',
          'description-too-long',
          `Meta description is ${description.length} characters and will be truncated.`,
        ),
      );
    }
  }

  if (!entity.h1?.trim()) {
    issues.push(issue(entity, 'error', 'missing-h1', 'The page renders no H1 heading.'));
  }

  if (!entity.ogImageUrl) {
    issues.push(
      issue(
        entity,
        'warning',
        'missing-og-image',
        'No Open Graph image; shares will fall back to the site default.',
      ),
    );
  }

  const missingAlt = entity.images.filter((img) => !img.altText?.trim());
  if (missingAlt.length > 0) {
    issues.push(
      issue(
        entity,
        'warning',
        'missing-alt-text',
        `${missingAlt.length} image(s) have no alt text.`,
      ),
    );
  }

  if (entity.slug && duplicateSlugs.has(entity.slug)) {
    issues.push(
      issue(
        entity,
        'error',
        'duplicate-slug',
        `The slug "${entity.slug}" is used by more than one record of this type.`,
      ),
    );
  }

  if (
    entity.canonicalUrl &&
    entity.publicPath &&
    !entity.canonicalUrl.endsWith(entity.publicPath)
  ) {
    issues.push(
      issue(
        entity,
        'info',
        'canonical-conflict',
        'The canonical URL points somewhere other than this page.',
      ),
    );
  }

  if (entity.isPublished && !entity.robotsIndex) {
    issues.push(
      issue(
        entity,
        'warning',
        'noindex-conflict',
        'This page is published but marked noindex, so it cannot appear in search results.',
      ),
    );
  }

  if (entity.isPublished && entity.robotsIndex && !entity.includeInSitemap) {
    issues.push(
      issue(entity, 'info', 'sitemap-excluded', 'Indexable but excluded from the sitemap.'),
    );
  }

  if (entity.brokenRelationIds.length > 0) {
    issues.push(
      issue(
        entity,
        'warning',
        'broken-related-content',
        `${entity.brokenRelationIds.length} related item(s) no longer exist or are unpublished.`,
      ),
    );
  }

  if (entity.isPublished && entity.isOrphan) {
    issues.push(issue(entity, 'info', 'orphan-content', 'Nothing on the site links to this page.'));
  }

  return issues;
}

export interface AuditSummary {
  editorialScore: number;
  checkedEntities: number;
  issues: SeoIssueDto[];
  issueCounts: { error: number; warning: number; info: number };
}

const SEVERITY_WEIGHT: Record<Severity, number> = { error: 3, warning: 1.5, info: 0.5 };
/** Worst realistic penalty for one entity, used to normalise the score. */
const MAX_PENALTY_PER_ENTITY = 9;

export function auditAll(entities: AuditableEntity[]): AuditSummary {
  const slugCounts = new Map<string, number>();
  for (const entity of entities) {
    if (!entity.slug) continue;
    const key = `${entity.entityType}:${entity.slug}`;
    slugCounts.set(key, (slugCounts.get(key) ?? 0) + 1);
  }
  const duplicates = new Set(
    Array.from(slugCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key.split(':')[1] as string),
  );

  const issues = entities.flatMap((entity) => auditEntity(entity, duplicates));
  const issueCounts = { error: 0, warning: 0, info: 0 };
  let penalty = 0;
  for (const item of issues) {
    issueCounts[item.severity] += 1;
    penalty += SEVERITY_WEIGHT[item.severity];
  }

  const capacity = Math.max(1, entities.length) * MAX_PENALTY_PER_ENTITY;
  const editorialScore = Math.max(0, Math.round(100 - (penalty / capacity) * 100));

  return { editorialScore, checkedEntities: entities.length, issues, issueCounts };
}

/** Length feedback rendered live next to the admin title/description inputs. */
export function lengthIndicator(
  value: string,
  kind: 'title' | 'description',
): { length: number; state: 'empty' | 'short' | 'good' | 'long'; hint: string } {
  const length = value.trim().length;
  const min = kind === 'title' ? SEO_LIMITS.titleMin : SEO_LIMITS.descriptionMin;
  const ideal = kind === 'title' ? SEO_LIMITS.titleIdealMax : SEO_LIMITS.descriptionIdealMax;
  const hard = kind === 'title' ? SEO_LIMITS.titleHardMax : SEO_LIMITS.descriptionHardMax;

  if (length === 0)
    return { length, state: 'empty', hint: `Add a ${kind} of ${min}-${ideal} characters.` };
  if (length < min)
    return { length, state: 'short', hint: `${min - length} more characters recommended.` };
  if (length > hard)
    return {
      length,
      state: 'long',
      hint: `${length - ideal} characters over the recommended length.`,
    };
  if (length > ideal)
    return { length, state: 'long', hint: 'Slightly long; may be truncated in some results.' };
  return { length, state: 'good', hint: 'Good length.' };
}
