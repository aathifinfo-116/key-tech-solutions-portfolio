import { z } from 'zod';
import { BUDGET_RANGES, PROJECT_TYPES } from '@kts/config';
import {
  consentSchema,
  emailSchema,
  honeypotSchema,
  optionalText,
  phoneSchema,
  text,
  urlSchema,
} from './common';

/**
 * Public form schemas.
 *
 * The same objects validate on the client (React Hook Form resolver) and on
 * the server (NestJS pipe), so a bypassed browser check is still rejected.
 */

/** Anti-automation fields present on every public form. */
const antiSpam = {
  website: honeypotSchema,
  /** Milliseconds between form render and submit. Server rejects < 2500ms. */
  elapsedMs: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000 * 60 * 60 * 6)
    .optional(),
};

export const contactFormSchema = z.object({
  name: text(120, 'Your name'),
  organization: optionalText(160),
  email: emailSchema,
  mobile: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  serviceInterest: optionalText(120),
  subject: text(160, 'Subject'),
  message: text(4000, 'Message').refine(
    (v) => v.length >= 20,
    'Message must be at least 20 characters',
  ),
  attachmentId: z.string().uuid().optional(),
  consent: consentSchema,
  sourcePage: optionalText(512),
  ...antiSpam,
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const quoteRequestSchema = z.object({
  organization: text(160, 'Organisation'),
  name: text(120, 'Your name'),
  email: emailSchema,
  mobile: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  projectType: z.enum(PROJECT_TYPES),
  businessChallenge: text(4000, 'Business challenge').refine(
    (v) => v.length >= 30,
    'Please describe the challenge in at least 30 characters',
  ),
  requiredFeatures: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
  existingSystem: optionalText(2000),
  budgetRange: z.enum(BUDGET_RANGES).optional(),
  preferredStart: optionalText(120),
  timelineNote: optionalText(500),
  attachmentId: z.string().uuid().optional(),
  consent: consentSchema,
  sourcePage: optionalText(512),
  ...antiSpam,
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const newsletterSchema = z.object({
  email: emailSchema,
  name: optionalText(120),
  consent: consentSchema,
  sourcePage: optionalText(512),
  ...antiSpam,
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const jobApplicationSchema = z.object({
  careerSlug: z.string().trim().min(1).max(96),
  applicantName: text(120, 'Your name'),
  email: emailSchema,
  mobile: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
  portfolioUrl: urlSchema.optional().or(z.literal('').transform(() => undefined)),
  linkedinUrl: urlSchema.optional().or(z.literal('').transform(() => undefined)),
  coverNote: optionalText(4000),
  cvDocumentId: z.string().uuid().optional(),
  consent: consentSchema,
  ...antiSpam,
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;

/** Minimum time a genuine person needs to complete a form, in milliseconds. */
export const MIN_FORM_FILL_MS = 2500;

export interface SpamAssessment {
  score: number;
  reasons: string[];
  isSpam: boolean;
}

const SPAM_PHRASES = [
  'seo services',
  'buy backlinks',
  'crypto investment',
  'guest post',
  'increase your ranking',
  'viagra',
  'casino',
  'loan offer',
];

/**
 * Heuristic spam scoring. Never auto-deletes: a high score marks the lead as
 * SPAM so a human can review it in the admin panel.
 */
export function assessSpam(input: {
  message?: string | null;
  subject?: string | null;
  honeypot?: string | null;
  elapsedMs?: number | null;
  email?: string | null;
}): SpamAssessment {
  const reasons: string[] = [];
  let score = 0;

  if (input.honeypot) {
    score += 1;
    reasons.push('honeypot-filled');
  }
  if (
    typeof input.elapsedMs === 'number' &&
    input.elapsedMs > 0 &&
    input.elapsedMs < MIN_FORM_FILL_MS
  ) {
    score += 0.5;
    reasons.push('submitted-too-fast');
  }

  const body = `${input.subject ?? ''} ${input.message ?? ''}`.toLowerCase();
  const phraseHits = SPAM_PHRASES.filter((p) => body.includes(p));
  if (phraseHits.length > 0) {
    score += Math.min(0.5, phraseHits.length * 0.2);
    reasons.push(`spam-phrase:${phraseHits.join('|')}`);
  }

  const linkCount = (body.match(/https?:\/\//g) ?? []).length;
  if (linkCount >= 4) {
    score += 0.4;
    reasons.push(`many-links:${linkCount}`);
  }

  if (body.length > 0 && body.replace(/[^A-Z]/g, '').length / Math.max(body.length, 1) > 0.5) {
    score += 0.2;
    reasons.push('shouting');
  }

  const rounded = Math.min(1, Number(score.toFixed(2)));
  return { score: rounded, reasons, isSpam: rounded >= 0.7 };
}
