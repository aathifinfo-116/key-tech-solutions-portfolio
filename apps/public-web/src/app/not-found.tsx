import Link from 'next/link';
import type { Metadata } from 'next';
import { ButtonLink, ButtonRow, Container, Section, SectionHeader } from '@kts/ui';

/**
 * 404 page.
 *
 * Offers the routes people usually wanted instead of a dead end.
 *
 * No `robots` directive is declared here: Next.js already emits `noindex` on
 * the not-found route, and adding our own would put two robots meta tags on
 * the same page. The links are deliberately followable, so a crawler that
 * lands on a dead URL can still find the live sections.
 */
export const metadata: Metadata = { title: 'Page not found' };

const SUGGESTIONS = [
  { label: 'Services', href: '/services', description: 'What we build and how' },
  { label: 'Products', href: '/products', description: 'KeySportsBooking and KeyAutoParts' },
  { label: 'Portfolio', href: '/portfolio', description: 'Platforms we have built' },
  { label: 'Insights', href: '/blog', description: 'Engineering and product write-ups' },
  { label: 'Careers', href: '/careers', description: 'Open roles' },
  { label: 'Contact', href: '/contact', description: 'Talk to the team' },
];

export default function NotFound() {
  return (
    <Section theme="WHITE">
      <Container width="narrow">
        <SectionHeader
          eyebrow="404"
          heading="That page does not exist"
          description="The link may be out of date, or the page may have been moved. Here is where most people are heading."
          level={1}
        />

        <ul
          style={{
            display: 'grid',
            gap: 'var(--kt-space-3)',
            listStyle: 'none',
            margin: '0 0 var(--kt-space-7)',
            padding: 0,
          }}
        >
          {SUGGESTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--kt-space-4)',
                  alignItems: 'center',
                  minHeight: 'var(--kt-touch-target-large)',
                  padding: 'var(--kt-space-3) var(--kt-space-4)',
                  border: '1px solid var(--kt-border-default)',
                  borderRadius: 'var(--kt-radius-md)',
                  textDecoration: 'none',
                  color: 'var(--kt-text-primary)',
                }}
              >
                <span style={{ fontWeight: 600 }}>{item.label}</span>
                <span
                  style={{ fontSize: 'var(--kt-text-meta)', color: 'var(--kt-text-secondary)' }}
                >
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <ButtonRow>
          <ButtonLink href="/">Back to the homepage</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Report a broken link
          </ButtonLink>
        </ButtonRow>
      </Container>
    </Section>
  );
}
