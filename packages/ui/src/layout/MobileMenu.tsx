'use client';

/**
 * Mobile navigation drawer.
 *
 * Accessibility contract:
 *  - the trigger is a real button with aria-expanded and aria-controls,
 *  - the drawer is a modal dialog with a label and a focus trap,
 *  - Escape closes it and focus returns to the trigger,
 *  - background scroll is locked while it is open,
 *  - every entry is a real anchor, so it works before hydration too.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { NavigationItemDto } from '@kts/shared-types';
import styles from './layout.module.css';

export interface MobileMenuProps {
  items: NavigationItemDto[];
  currentPath: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  brandName: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function MobileMenu({
  items,
  currentPath,
  primaryCta,
  secondaryCta,
  brandName,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Escape to close, Tab cycles within the drawer.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0] as HTMLElement;
      const last = nodes[nodes.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the drawer once it is on screen.
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  // A route change should not leave the drawer open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  const isCurrent = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);

  /*
    The drawer is portalled to <body> rather than rendered where it sits in
    the tree, because the header carries `backdrop-filter`. Any of
    backdrop-filter, filter, transform or perspective makes an element the
    containing block for its `position: fixed` descendants - so a drawer
    rendered inside the header resolves `inset: 0` against the header's 72px
    box instead of the viewport, collapsing to a strip with every link
    overflowing out of sight. A modal belongs at the document root anyway.
  */
  const drawer =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div className={styles.overlay} onClick={close} aria-hidden="true" />
            <div
              id={drawerId}
              ref={drawerRef}
              className={styles.drawer}
              role="dialog"
              aria-modal="true"
              aria-label={`${brandName} navigation`}
            >
              <div className={styles.drawerHeader}>
                <span
                  className={styles.footerBrandName}
                  style={{ color: 'var(--kt-color-ink)', fontSize: '1.125rem' }}
                >
                  {brandName}
                </span>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={close}
                  aria-label="Close navigation"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav className={styles.drawerBody} aria-label="Main">
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        className={styles.drawerLink}
                        href={item.href}
                        aria-current={isCurrent(item.href) ? 'page' : undefined}
                        onClick={close}
                      >
                        {item.label}
                      </Link>
                      {item.children.length > 0 ? (
                        <ul className={styles.drawerSubList}>
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                className={styles.drawerSubLink}
                                href={child.href}
                                onClick={close}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className={styles.drawerFooter}>
                <Link
                  href={primaryCta.href}
                  onClick={close}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'var(--kt-touch-target-large)',
                    borderRadius: 'var(--kt-radius-sm)',
                    background: 'var(--kt-gradient-brand)',
                    color: '#fff',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {primaryCta.label}
                </Link>
                {secondaryCta ? (
                  <Link
                    href={secondaryCta.href}
                    onClick={close}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 'var(--kt-touch-target-large)',
                      borderRadius: 'var(--kt-radius-sm)',
                      border: '1px solid var(--kt-border-strong)',
                      color: 'var(--kt-color-ink)',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {/*
        Without JavaScript this button cannot open anything, so it hides
        itself rather than sitting there as a dead control. The footer
        carries the same navigation and is server rendered, so the site stays
        fully navigable either way.
      */}
      <noscript>
        <style>{'[data-mobile-menu-trigger]{display:none !important}'}</style>
      </noscript>
      <button
        ref={triggerRef}
        type="button"
        data-mobile-menu-trigger
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        Menu
      </button>
      {drawer}
    </>
  );
}
