/**
 * Rich text sanitisation.
 *
 * All editor-supplied HTML passes through here before it is stored and again
 * is trusted only because it was sanitised on the way in. Scripts, event
 * handlers, styles, iframes from unknown origins and dangerous URL schemes are
 * removed rather than escaped.
 */

import sanitizeHtml from 'sanitize-html';

/** Video embed hosts we are willing to render in an iframe. */
export const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
];

const BASE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'sub',
    'sup',
    'mark',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'q',
    'cite',
    'pre',
    'code',
    'kbd',
    'samp',
    'a',
    'img',
    'figure',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
    'hr',
    'span',
    'div',
    'small',
    'abbr',
    'time',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    th: ['scope', 'colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    code: ['class'],
    pre: ['class'],
    span: ['class'],
    div: ['class'],
    abbr: ['title'],
    time: ['datetime'],
    col: ['span'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
  transformTags: {
    // Every outbound link is forced to a safe rel, and h1 is demoted so the
    // page keeps exactly one top-level heading.
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(isExternal ? { rel: 'noopener noreferrer nofollow', target: '_blank' } : {}),
        },
      };
    },
    h1: 'h2',
  },
};

const WITH_EMBEDS: sanitizeHtml.IOptions = {
  ...BASE_OPTIONS,
  allowedTags: [...(BASE_OPTIONS.allowedTags as string[]), 'iframe'],
  allowedAttributes: {
    ...(BASE_OPTIONS.allowedAttributes as Record<string, string[]>),
    iframe: ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'loading'],
  },
  allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
  allowIframeRelativeUrls: false,
  // sanitize-html strips a disallowed iframe src but keeps the empty element.
  // Drop any iframe left without a source so no hollow frame reaches the page.
  exclusiveFilter: (frame) => frame.tag === 'iframe' && !frame.attribs.src,
};

export interface SanitizeOptions {
  /** Permit YouTube / Vimeo iframes. Off by default. */
  allowEmbeds?: boolean;
}

/** Sanitises rich text HTML for storage and rendering. */
export function sanitizeRichText(
  html: string | null | undefined,
  options: SanitizeOptions = {},
): string {
  if (!html) return '';
  return sanitizeHtml(html, options.allowEmbeds ? WITH_EMBEDS : BASE_OPTIONS).trim();
}

/** Strips every tag, leaving plain text. Used for excerpts and SEO fallbacks. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escapes text destined for a plain-text context that will be rendered as HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Estimates reading time in whole minutes at 220 words per minute.
 * Always returns at least 1.
 */
export function estimateReadingMinutes(html: string | null | undefined): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

const SAFE_INTERNAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@/%?#[\]]*$/;

/**
 * Guards against open redirects. Only same-origin paths and explicitly
 * allow-listed hosts are accepted; everything else is rejected.
 */
export function isSafeRedirectTarget(target: string, allowedHosts: string[] = []): boolean {
  if (!target) return false;
  if (target.startsWith('//')) return false;
  if (SAFE_INTERNAL_PATH.test(target)) return true;
  try {
    const url = new URL(target);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return allowedHosts.includes(url.host);
  } catch {
    return false;
  }
}
