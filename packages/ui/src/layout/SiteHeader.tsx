'use client';

/**
 * Site header.
 *
 * A client component purely so it can read the current pathname and mark the
 * active route. Keeping that out of the root layout means pages stay
 * statically generated instead of being forced dynamic by `headers()`.
 * The markup is still server-rendered on first load, so every navigation link
 * is present in the HTML a crawler receives.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { BrandDto, NavigationItemDto } from '@kts/shared-types';
import { ButtonLink, Container } from '../primitives';
import { SmartLogo } from '../media/SmartImage';
import { MobileMenu } from './MobileMenu';
import styles from './layout.module.css';

export interface SiteHeaderProps {
  brand: BrandDto;
  navigation: NavigationItemDto[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function SiteHeader({ brand, navigation, primaryCta, secondaryCta }: SiteHeaderProps) {
  const pathname = usePathname() ?? '/';

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label={`${brand.companyName} home`}>
            {brand.logoLight ? (
              <SmartLogo media={brand.logoLight} alt={`${brand.companyName} logo`} height={34} />
            ) : (
              <>
                <span className={styles.brandWordmark}>{brand.shortName}</span>
                <span className={styles.brandSuffix}>Solutions</span>
              </>
            )}
          </Link>

          <nav className={styles.desktopNav} aria-label="Main">
            {navigation.map((item) => (
              <div key={item.id} className={styles.navItem}>
                <Link
                  className={styles.navLink}
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                >
                  {item.label}
                  {item.children.length > 0 ? (
                    <svg
                      className={styles.navCaret}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </Link>

                {item.children.length > 0 ? (
                  <div className={styles.dropdown}>
                    {item.children.map((child) => (
                      <Link key={child.id} className={styles.dropdownLink} href={child.href}>
                        <span className={styles.dropdownLabel}>{child.label}</span>
                        {child.description ? (
                          <span className={styles.dropdownDescription}>{child.description}</span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          {/*
            One call to action only. Two would need 333px beside a nine-item
            navigation, which does not fit the 1200px content column at any
            viewport width. The secondary action stays in the drawer and in
            the hero, where it has room.
          */}
          <div className={styles.headerActions}>
            <ButtonLink href={primaryCta.href} variant="primary" size="small">
              {primaryCta.label}
            </ButtonLink>
          </div>

          <MobileMenu
            items={navigation}
            currentPath={pathname}
            primaryCta={primaryCta}
            secondaryCta={secondaryCta}
            brandName={brand.companyName}
          />
        </div>
      </Container>
    </header>
  );
}
