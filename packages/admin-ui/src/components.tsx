'use client';

/**
 * Admin design system.
 *
 * Client components throughout: the admin panel is an application, not a
 * document. Every control is a real form element with a label, every
 * destructive action is visually distinct, and status is never communicated
 * by colour alone.
 */

import {
  forwardRef,
  useId,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import Link from 'next/link';
import type { PublicationStatus } from '@kts/shared-types';
import styles from './admin.module.css';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {description ? <p className={styles.pageDescription}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  actions,
  children,
  padded = true,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={styles.panel}>
      {title || actions ? (
        <div className={styles.panelHeader}>
          {title ? <h2 className={styles.panelTitle}>{title}</h2> : <span />}
          {actions ? <div className={styles.inline}>{actions}</div> : null}
        </div>
      ) : null}
      {padded ? <div className={styles.panelBody}>{children}</div> : children}
    </section>
  );
}

export function Grid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={cx(styles.grid, styles[`grid${columns}`])}>{children}</div>;
}

export function Stack({ children, tight }: { children: ReactNode; tight?: boolean }) {
  return <div className={tight ? styles.stackTight : styles.stack}>{children}</div>;
}

export function Inline({ children }: { children: ReactNode }) {
  return <div className={styles.inline}>{children}</div>;
}

export function Spread({ children }: { children: ReactNode }) {
  return <div className={styles.spread}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClass: Record<Variant, string> = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  ghost: styles.buttonGhost,
  danger: styles.buttonDanger,
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  small,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, variantClass[variant], small && styles.buttonSmall, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  small?: boolean;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = 'secondary',
  small,
  children,
  className,
  ...rest
}: LinkButtonProps) {
  const classes = cx(styles.button, variantClass[variant], small && styles.buttonSmall, className);
  if (/^https?:\/\//i.test(href)) {
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

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  optional,
  counter,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  counter?: ReactNode;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <div className={styles.spread}>
        <label className={styles.label} htmlFor={id}>
          {label}
          {optional ? <span className={styles.optional}> (optional)</span> : null}
        </label>
        {counter}
      </div>
      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <span className={styles.error} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(styles.input, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cx(styles.textarea, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cx(styles.select, className)} {...props}>
        {children}
      </select>
    );
  },
);

export function CheckboxRow({
  id,
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string }) {
  return (
    <div className={styles.checkRow}>
      <input id={id} type="checkbox" className={styles.checkbox} {...props} />
      <label
        htmlFor={id}
        className={styles.hint}
        style={{ color: 'var(--kt-text-primary)', fontSize: 13.5 }}
      >
        {label}
        {hint ? (
          <span className={styles.hint} style={{ display: 'block' }}>
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}

export function FieldRow({ children, two }: { children: ReactNode; two?: boolean }) {
  return <div className={cx(styles.fieldRow, two && styles.fieldRowTwo)}>{children}</div>;
}

/**
 * Live length feedback for SEO fields.
 * Communicates state with text as well as colour.
 */
export function LengthCounter({
  value,
  min,
  ideal,
  hard,
}: {
  value: string;
  min: number;
  ideal: number;
  hard: number;
}) {
  const length = value.trim().length;
  const state = length === 0 ? 'empty' : length < min ? 'short' : length > hard ? 'long' : 'good';
  const tone =
    state === 'good'
      ? styles.counterGood
      : state === 'long'
        ? styles.counterLong
        : state === 'empty'
          ? styles.counterEmpty
          : '';
  const wording =
    state === 'empty'
      ? 'empty'
      : state === 'short'
        ? 'short'
        : state === 'long'
          ? 'too long'
          : 'good';

  return (
    <span className={cx(styles.counter, tone)}>
      {length}/{ideal} - {wording}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className={styles.tableWrap}>{children}</div>;
}

export function Table({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <table className={styles.table}>
      {caption ? <caption className="kt-visually-hidden">{caption}</caption> : null}
      {children}
    </table>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function SortHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
}: {
  label: string;
  field: string;
  activeField?: string;
  direction?: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const isActive = activeField === field;
  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" className={styles.sortButton} onClick={() => onSort(field)}>
        {label}
        <span aria-hidden="true">{isActive ? (direction === 'asc' ? '↑' : '↓') : '⇅'}</span>
      </button>
    </th>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <td key={cellIndex}>
              <div
                className={styles.skeletonRow}
                style={{ width: cellIndex === 0 ? '60%' : '40%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={styles.pagination}>
      <span aria-live="polite">
        {total === 0 ? 'No records' : `Showing ${from}-${to} of ${total}`}
      </span>
      <div className={styles.paginationControls}>
        <Button small onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button small onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status, badges, feedback
// ---------------------------------------------------------------------------

const statusClass: Record<string, string> = {
  DRAFT: styles.badgeDraft,
  REVIEW: styles.badgeReview,
  SCHEDULED: styles.badgeScheduled,
  PUBLISHED: styles.badgePublished,
  ARCHIVED: styles.badgeArchived,
  OPEN: styles.badgePublished,
  CLOSED: styles.badgeDraft,
  NEW: styles.badgeScheduled,
  SPAM: styles.badgeError,
  WON: styles.badgePublished,
  LOST: styles.badgeDraft,
};

/** Status pill. Always carries a dot and a word, never colour alone. */
export function StatusBadge({ status }: { status: string }) {
  const label = status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
  return (
    <span className={cx(styles.badge, statusClass[status] ?? styles.badgeNeutral)}>
      <span className={styles.badgeDot} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'error' | 'published' | 'review';
}) {
  const toneClass = {
    neutral: styles.badgeNeutral,
    brand: styles.badgeBrand,
    error: styles.badgeError,
    published: styles.badgePublished,
    review: styles.badgeReview,
  }[tone];
  return <span className={cx(styles.badge, toneClass)}>{children}</span>;
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}) {
  const toneClass = {
    info: styles.noticeInfo,
    success: styles.noticeSuccess,
    warning: styles.noticeWarning,
    error: styles.noticeError,
  }[tone];
  return (
    <div className={cx(styles.notice, toneClass)} role={tone === 'error' ? 'alert' : 'status'}>
      <div>
        {title ? <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

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

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className={styles.chipRow}>{children}</div>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className={styles.mono}>{children}</span>;
}

export function ScrollBox({ children }: { children: ReactNode }) {
  return <div className={styles.scrollBox}>{children}</div>;
}

export function PermissionGrid({ children }: { children: ReactNode }) {
  return <div className={styles.permissionGrid}>{children}</div>;
}

export type { PublicationStatus };
export { styles as adminStyles };
