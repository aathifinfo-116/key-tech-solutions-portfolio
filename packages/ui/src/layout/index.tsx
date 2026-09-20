/**
 * Site chrome: announcement bar, header and footer.
 *
 * All three are server components driven by data from the API, so navigation,
 * footer links, brand name and announcements are editable without a deploy.
 * The only client component is the mobile drawer.
 */

import Link from 'next/link';
import type { AnnouncementDto, BrandDto, FooterGroupDto, SocialLinkDto } from '@kts/shared-types';
import { Container } from '../primitives';

import { MobileMenu } from './MobileMenu';
import { SiteHeader } from './SiteHeader';
import styles from './layout.module.css';

export { MobileMenu, SiteHeader };
export type { SiteHeaderProps } from './SiteHeader';

// ---------------------------------------------------------------------------
// Announcement bar
// ---------------------------------------------------------------------------

export function AnnouncementBar({ announcement }: { announcement: AnnouncementDto | null }) {
  if (!announcement) return null;
  return (
    <div
      className={styles.announcement}
      data-tone={announcement.tone}
      role="region"
      aria-label="Announcement"
    >
      <Container>
        <div className={styles.announcementInner}>
          <span>{announcement.message}</span>
          {announcement.linkHref && announcement.linkLabel ? (
            <Link className={styles.announcementLink} href={announcement.linkHref}>
              {announcement.linkLabel}
            </Link>
          ) : null}
        </div>
      </Container>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export interface SiteFooterProps {
  brand: BrandDto;
  groups: FooterGroupDto[];
  socialLinks: SocialLinkDto[];
  /** Rendered verbatim; keep it factual. */
  note?: string;
}

export function SiteFooter({ brand, groups, socialLinks, note }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <span className={styles.footerBrandName}>{brand.companyName}</span>
            {brand.tagline ? <p className={styles.footerTagline}>{brand.tagline}</p> : null}
            {brand.contactEmail ? (
              <a className={styles.footerLink} href={`mailto:${brand.contactEmail}`}>
                {brand.contactEmail}
              </a>
            ) : null}
            {brand.contactPhone ? (
              <a
                className={styles.footerLink}
                href={`tel:${brand.contactPhone.replace(/\s+/g, '')}`}
              >
                {brand.contactPhone}
              </a>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className={styles.socialRow}>
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    className={styles.socialLink}
                    href={link.url}
                    rel="noopener noreferrer me"
                    target="_blank"
                    aria-label={link.label}
                  >
                    {link.label.slice(0, 2)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {groups.map((group) => (
            <nav key={group.key} aria-label={group.title}>
              <p className={styles.footerGroupTitle}>{group.title}</p>
              <ul className={styles.footerList}>
                {group.links.map((link) => (
                  <li key={`${group.key}-${link.href}-${link.label}`}>
                    {link.isExternal ? (
                      <a
                        className={styles.footerLink}
                        href={link.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link className={styles.footerLink} href={link.href}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <span>
            &copy; {year} {brand.legalName ?? brand.companyName}. All rights reserved.
          </span>
          {note ? <span className={styles.footerNote}>{note}</span> : null}
        </div>
      </Container>
    </footer>
  );
}
