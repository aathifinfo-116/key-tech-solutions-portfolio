import { z } from 'zod';
import { PAGINATION } from '@kts/config';
import { SLUG_PATTERN } from './slug';

export const uuidSchema = z.string().uuid('must be a valid identifier');

export const slugSchema = z
  .string()
  .min(1, 'is required')
  .max(96, 'must be 96 characters or fewer')
  .regex(SLUG_PATTERN, 'may only contain lowercase letters, numbers and single hyphens');

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email('must be a valid email address')
  .transform((v) => v.toLowerCase());

export const phoneSchema = z
  .string()
  .trim()
  .min(6, 'must be at least 6 characters')
  .max(32, 'must be 32 characters or fewer')
  .regex(/^[+0-9()\-.\s]+$/, 'may only contain digits and + ( ) - . characters');

export const urlSchema = z
  .string()
  .trim()
  .url('must be a valid URL')
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), 'must start with http:// or https://');

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex colour such as #6436A3');

export const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date'));

export const publicationStatusSchema = z.enum([
  'DRAFT',
  'REVIEW',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
]);

export const sortDirectionSchema = z.enum(['asc', 'desc']).default('desc');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export const listQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(160).optional(),
  status: publicationStatusSchema.optional(),
  sortBy: z.string().trim().max(40).optional(),
  sortDir: sortDirectionSchema.optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export const idParamSchema = z.object({ id: uuidSchema });
export const slugParamSchema = z.object({ slug: slugSchema });

/** Trimmed non-empty string with an upper bound. */
export const text = (max: number, label = 'This field') =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

/** Optional trimmed string that becomes `undefined` when blank. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

/** Array of short strings used for bullet lists (benefits, requirements, ...). */
export const stringList = (maxItems = 24, maxLength = 240) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).default([]);

export const seoInputSchema = z.object({
  title: optionalText(70),
  description: optionalText(300),
  canonicalUrl: urlSchema.optional().or(z.literal('').transform(() => undefined)),
  ogTitle: optionalText(95),
  ogDescription: optionalText(300),
  ogImageId: uuidSchema.optional().nullable(),
  twitterCard: z.enum(['summary', 'summary_large_image']).default('summary_large_image'),
  keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  robotsIndex: z.boolean().default(true),
  robotsFollow: z.boolean().default(true),
  includeInSitemap: z.boolean().default(true),
  sitemapPriority: z.number().min(0).max(1).default(0.5),
  sitemapFrequency: z
    .enum(['ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER'])
    .default('WEEKLY'),
});

export type SeoInput = z.infer<typeof seoInputSchema>;

export const ctaInputSchema = z.object({
  heading: optionalText(160),
  description: optionalText(400),
  label: optionalText(60),
  href: optionalText(2048),
});

/** Consent checkbox that must be ticked. */
export const consentSchema = z
  .boolean()
  .refine((v) => v === true, 'You must agree before submitting this form');

/**
 * Honeypot field. Real people leave it blank; most naive bots fill it in.
 * Paired with server-side rate limiting and a minimum fill time.
 */
export const honeypotSchema = z
  .string()
  .max(0, 'Submission rejected')
  .optional()
  .or(z.literal('').optional());
