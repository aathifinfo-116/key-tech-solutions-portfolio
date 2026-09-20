/**
 * Redirect rule validation.
 *
 * Guards against loops, long chains, unsafe external destinations, duplicate
 * sources and rules that would shadow the API, the admin panel or preview.
 */

import { REDIRECT_MAX_CHAIN, REDIRECT_PROTECTED_PREFIXES } from '@kts/config';
import { REDIRECT_HTTP_CODE, type RedirectStatus } from '@kts/shared-types';
import { normalisePath } from './slug';

export interface RedirectRuleLike {
  source: string;
  destination: string;
  status: RedirectStatus;
  isActive: boolean;
}

export interface RedirectValidationResult {
  ok: boolean;
  errors: string[];
  normalised?: { source: string; destination: string };
}

function isExternal(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isProtected(path: string): boolean {
  return REDIRECT_PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export interface ValidateRedirectOptions {
  existing: RedirectRuleLike[];
  /** Hosts an external destination may point at. Empty means internal only. */
  allowedExternalHosts?: string[];
  /** Id of the rule being edited, so it does not clash with itself. */
  ignoreSource?: string;
}

export function validateRedirect(
  rule: { source: string; destination: string; status: RedirectStatus },
  options: ValidateRedirectOptions,
): RedirectValidationResult {
  const errors: string[] = [];
  const allowedHosts = options.allowedExternalHosts ?? [];

  if (!rule.source?.trim()) errors.push('Source path is required.');
  if (rule.status !== 'GONE_410' && !rule.destination?.trim()) {
    errors.push('Destination is required.');
  }
  if (errors.length > 0) return { ok: false, errors };

  if (isExternal(rule.source)) {
    errors.push('Source must be a path on this site, not a full URL.');
    return { ok: false, errors };
  }

  const source = normalisePath(rule.source.trim());
  const destinationRaw = rule.destination?.trim() ?? '';
  const destination = isExternal(destinationRaw)
    ? destinationRaw
    : normalisePath(destinationRaw || '/');

  if (isProtected(source)) {
    errors.push(`Redirects may not start from ${REDIRECT_PROTECTED_PREFIXES.join(', ')}.`);
  }

  if (rule.status === 'GONE_410') {
    // 410 has no destination; anything supplied is ignored.
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, errors: [], normalised: { source, destination: '' } };
  }

  if (isExternal(destination)) {
    let host: string;
    try {
      host = new URL(destination).host;
    } catch {
      errors.push('Destination is not a valid URL.');
      return { ok: false, errors };
    }
    if (!allowedHosts.includes(host)) {
      errors.push(`External destination host "${host}" is not on the allow list.`);
    }
  } else if (isProtected(destination)) {
    errors.push('Redirects may not target the API, admin panel or preview routes.');
  }

  if (source === destination) {
    errors.push('Source and destination are identical, which would loop forever.');
  }

  const others = options.existing.filter(
    (r) =>
      normalisePath(r.source) !==
      (options.ignoreSource ? normalisePath(options.ignoreSource) : null),
  );
  if (others.some((r) => normalisePath(r.source) === source)) {
    errors.push(`A redirect from ${source} already exists.`);
  }

  if (!isExternal(destination)) {
    const chain = followChain(destination, [
      ...others,
      { source, destination, status: rule.status, isActive: true },
    ]);
    // followChain starts at the destination, so the rule under validation is
    // one further hop that has to be counted.
    const totalHops = chain.length + 1;
    if (chain.loop) {
      errors.push('This redirect creates a loop with an existing rule.');
    } else if (totalHops > REDIRECT_MAX_CHAIN) {
      errors.push(
        `This redirect creates a chain of ${totalHops} hops; the maximum is ${REDIRECT_MAX_CHAIN}.`,
      );
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], normalised: { source, destination } };
}

export interface ChainResult {
  length: number;
  loop: boolean;
  finalDestination: string;
  visited: string[];
}

/** Walks the redirect graph from `start`, detecting loops. */
export function followChain(start: string, rules: RedirectRuleLike[], maxHops = 12): ChainResult {
  const bySource = new Map(
    rules.filter((r) => r.isActive).map((r) => [normalisePath(r.source), r] as const),
  );
  const visited: string[] = [];
  let current = isExternal(start) ? start : normalisePath(start);
  let hops = 0;

  while (hops < maxHops) {
    if (isExternal(current)) break;
    if (visited.includes(current)) {
      return { length: hops, loop: true, finalDestination: current, visited };
    }
    visited.push(current);
    const next = bySource.get(current);
    if (!next || next.status === 'GONE_410') break;
    current = isExternal(next.destination) ? next.destination : normalisePath(next.destination);
    hops += 1;
  }

  return { length: hops, loop: hops >= maxHops, finalDestination: current, visited };
}

/** Resolves the HTTP status code a rule must respond with. */
export function redirectHttpStatus(status: RedirectStatus): number {
  return REDIRECT_HTTP_CODE[status];
}

/**
 * Builds the rule proposed to the editor when a published item's slug changes,
 * so existing inbound links and search results keep working.
 */
export function buildSlugChangeRedirect(params: {
  basePath: string;
  oldSlug: string;
  newSlug: string;
}): { source: string; destination: string; status: RedirectStatus; reason: string } {
  const base = normalisePath(params.basePath);
  return {
    source: normalisePath(`${base}/${params.oldSlug}`),
    destination: normalisePath(`${base}/${params.newSlug}`),
    status: 'PERMANENT_301',
    reason: `Slug changed from "${params.oldSlug}" to "${params.newSlug}".`,
  };
}
