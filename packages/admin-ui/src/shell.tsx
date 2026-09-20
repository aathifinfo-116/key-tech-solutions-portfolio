'use client';

/**
 * Administration shell: sidebar navigation, top bar and content area.
 *
 * Navigation is filtered by the signed-in user's permissions purely so the UI
 * is not cluttered with links that would be refused. It is not a security
 * control: every one of those routes is enforced server side by the API.
 */

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUserDto } from '@kts/shared-types';
import { Button, cx } from './components';
import styles from './admin.module.css';

export interface NavItem {
  label: string;
  href: string;
  /** Hidden from the menu when the user lacks this permission. */
  permission?: string;
  count?: number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface AdminShellProps {
  user: SessionUserDto;
  groups: NavGroup[];
  title: string;
  onSignOut: () => void;
  children: ReactNode;
}

export function AdminShell({ user, groups, title, onSignOut, children }: AdminShellProps) {
  const pathname = usePathname() ?? '/';
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer when the route changes, so it never covers the new page.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const held = new Set(user.permissions);
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || held.has(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className={styles.shell}>
      {drawerOpen ? (
        <div
          className={styles.sidebarScrim}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cx(styles.sidebar, drawerOpen && styles.sidebarOpen)}
        aria-label="Admin sections"
        id="admin-sidebar"
      >
        <div className={styles.sidebarBrand}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className={styles.brandMark}>Key Tech</span>
            <span className={styles.brandSub}>Admin</span>
          </Link>
          <Button
            small
            variant="ghost"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <span aria-hidden="true">&times;</span>
          </Button>
        </div>

        <nav className={styles.nav}>
          {visibleGroups.map((group) => (
            <div key={group.title} className={styles.navGroup}>
              <p className={styles.navGroupTitle}>{group.title}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(styles.navLink, isActive(item.href) && styles.navLinkActive)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 ? (
                    <span className={styles.navCount}>{item.count}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <Button
              small
              variant="secondary"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-controls="admin-sidebar"
              className="kt-menu-button"
            >
              Menu
            </Button>
            <span className={styles.topbarTitle}>{title}</span>
          </div>

          <div className={styles.topbarRight}>
            <Link
              href="/account"
              className={styles.userChip}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span className={styles.avatar} aria-hidden="true">
                {initials(user.name)}
              </span>
              <span>
                <span className={styles.userName} style={{ display: 'block' }}>
                  {user.name}
                </span>
                <span className={styles.userRole}>
                  {user.roles.map((role) => role.name).join(', ')}
                </span>
              </span>
            </Link>
            <Button small variant="ghost" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </header>

        <main className={styles.content} id="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
