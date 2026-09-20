/**
 * Design system primitives.
 *
 * All server components: none of them holds state or listens to events, so
 * none of them ships JavaScript to the browser.
 */

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { sectionThemeTokens, type SectionThemeKey } from '@kts/config';
import styles from './primitives.module.css';

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export interface ContainerProps {
  children: ReactNode;
  width?: 'default' | 'wide' | 'narrow';
  className?: string;
  as?: ElementType;
}

export function Container({
  children,
  width = 'default',
  className,
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag
      className={cx(
        styles.container,
        width === 'wide' && styles.wide,
        width === 'narrow' && styles.narrow,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export interface SectionProps {
  children: ReactNode;
  theme?: SectionThemeKey;
  id?: string;
  compact?: boolean;
  bordered?: boolean;
  width?: ContainerProps['width'];
  className?: string;
  /** Renders without the inner container, for full-bleed layouts. */
  bleed?: boolean;
  as?: ElementType;
}

/**
 * A themed page band. Theme colours are set as CSS custom properties on the
 * element, so nested components adapt without prop drilling.
 */
export function Section({
  children,
  theme = 'WHITE',
  id,
  compact,
  bordered,
  width,
  className,
  bleed,
  as: Tag = 'section',
}: SectionProps) {
  const tokens = sectionThemeTokens[theme] ?? sectionThemeTokens.WHITE;
  return (
    <Tag
      id={id}
      className={cx(
        styles.section,
        compact && styles.compact,
        bordered && styles.bordered,
        className,
      )}
      data-theme={theme}
      style={
        {
          '--section-bg': tokens.background,
          '--section-fg': tokens.text,
          '--section-muted': tokens.muted,
          '--section-border': tokens.border,
        } as React.CSSProperties
      }
    >
      {bleed ? children : <Container width={width}>{children}</Container>}
    </Tag>
  );
}

/** True when a theme needs light-on-dark treatment for buttons and cards. */
export function isDarkTheme(theme: SectionThemeKey | undefined): boolean {
  return theme === 'DARK' || theme === 'BRAND_GRADIENT';
}

// ---------------------------------------------------------------------------
// Headings
// ---------------------------------------------------------------------------

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx(styles.eyebrow, className)}>
      <span className={styles.eyebrowMark} aria-hidden="true" />
      {children}
    </span>
  );
}

export interface SectionHeaderProps {
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  /** Heading level. Only one h1 per page, so sections default to h2. */
  level?: 1 | 2 | 3;
  align?: 'start' | 'center' | 'split';
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  heading,
  description,
  level = 2,
  align = 'start',
  action,
  className,
}: SectionHeaderProps) {
  if (!eyebrow && !heading && !description) return null;
  const Tag = `h${level}` as ElementType;
  const headingClass = level === 1 ? styles.pageHeading : styles.sectionHeading;

  return (
    <div
      className={cx(
        styles.header,
        align === 'center' && styles.centered,
        align === 'split' && styles.split,
        className,
      )}
    >
      <div className={styles.headerText}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {heading ? <Tag className={headingClass}>{heading}</Tag> : null}
        {description ? <p className={styles.lead}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx(styles.lead, className)}>{children}</p>;
}

// ---------------------------------------------------------------------------
// Buttons and links
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  onDark?: boolean;
  block?: boolean;
  children: ReactNode;
}

/**
 * A real anchor, always. Navigation must work without JavaScript and must be
 * crawlable, so nothing here is a click handler on a div.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'default',
  onDark,
  block,
  children,
  className,
  ...rest
}: ButtonLinkProps) {
  const classes = cx(
    styles.button,
    styles[variant],
    size === 'small' && styles.small,
    onDark && styles.onDark,
    block && styles.block,
    className,
  );
  const isExternal = /^https?:\/\//i.test(href);

  if (isExternal) {
    return (
      <a className={classes} href={href} rel="noopener noreferrer" target="_blank" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} {...rest}>
      {children}
    </Link>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  onDark?: boolean;
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  onDark,
  block,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        size === 'small' && styles.small,
        onDark && styles.onDark,
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.buttonRow, className)}>{children}</div>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className={styles.textLink} href={href}>
      {children}
      <svg
        className={styles.textLinkArrow}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 8h9M8.5 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export interface CardProps {
  children: ReactNode;
  href?: string;
  onDark?: boolean;
  className?: string;
}

export function Card({ children, href, onDark, className }: CardProps) {
  const classes = cx(
    styles.card,
    href && styles.interactive,
    onDark && styles.onDarkSurface,
    className,
  );
  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }
  return <div className={classes}>{children}</div>;
}

export function CardHeading({
  children,
  as: Tag = 'h3',
}: {
  children: ReactNode;
  as?: ElementType;
}) {
  return <Tag className={styles.cardHeading}>{children}</Tag>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <p className={styles.cardBody}>{children}</p>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className={styles.cardFooter}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'warning';
  /** Adds a dot so status is not conveyed by colour alone. */
  withDot?: boolean;
}

export function Badge({ children, tone = 'neutral', withDot }: BadgeProps) {
  const toneClass = {
    neutral: styles.badgeNeutral,
    brand: styles.badgeBrand,
    accent: styles.badgeAccent,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
  }[tone];

  return (
    <span className={cx(styles.badge, toneClass)}>
      {withDot ? <span className={styles.badgeDot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export function Grid({
  children,
  columns = 3,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cx(
        styles.grid,
        styles[`cols${columns}` as keyof typeof styles] as string,
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prose
// ---------------------------------------------------------------------------

/**
 * Renders editor-authored HTML.
 *
 * The HTML was sanitised on the way into the database by @kts/validation, so
 * what is stored is already safe; this component does not re-sanitise on every
 * render. Never pass unsanitised input here.
 */
export function Prose({
  html,
  wide,
  className,
}: {
  html: string;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(styles.prose, wide && styles.wide, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ProseContainer({
  children,
  wide,
  className,
}: {
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return <div className={cx(styles.prose, wide && styles.wide, className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Check list
// ---------------------------------------------------------------------------

export function CheckList({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={cx(styles.checkList, className)}>
      {items.map((item) => (
        <li key={item} className={styles.checkItem}>
          <svg
            className={styles.checkIcon}
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
            <path
              d="M6 10.3l2.6 2.6L14 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Skip link and screen-reader text
// ---------------------------------------------------------------------------

export function SkipLink({
  href = '#main',
  children = 'Skip to main content',
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a className={styles.skipLink} href={href}>
      {children}
    </a>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="kt-visually-hidden">{children}</span>;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export function MediaFrame({
  children,
  branded,
  className,
}: {
  children: ReactNode;
  branded?: boolean;
  className?: string;
}) {
  return (
    <div className={cx(styles.mediaFrame, branded && styles.branded, className)}>{children}</div>
  );
}

/**
 * Stands in for an image that has not been uploaded yet.
 * Keeps the layout stable (fixed aspect ratio) so nothing shifts when a real
 * image is added later.
 */
export function MediaPlaceholder({ label, ratio = '4 / 3' }: { label?: string; ratio?: string }) {
  return (
    <div
      className={styles.mediaPlaceholder}
      style={{ '--placeholder-ratio': ratio } as React.CSSProperties}
    >
      <svg
        className={styles.placeholderMark}
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17" cy="20" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M8 33l9-8 6 5 6-6 11 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export { styles as primitiveStyles, cx };
