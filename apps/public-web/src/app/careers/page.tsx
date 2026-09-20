import Link from 'next/link';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { EMPLOYMENT_TYPE_LABEL, WORKPLACE_TYPE_LABEL } from '@kts/shared-types';
import { collectionPageJsonLd } from '@kts/seo';
import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardFooter,
  CardHeading,
  CtaPanel,
  EmptyState,
  Grid,
  PageHero,
  Section,
  SectionHeader,
  ValueGrid,
} from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const DESCRIPTION =
  'Open roles at Key Tech Solutions, and how we work day to day. Every posting lists what the role actually involves.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/careers', title: 'Careers', description: DESCRIPTION });
}

export default async function CareersPage() {
  const [careers, values] = await Promise.all([
    api.careers().catch(() => []),
    api.values().catch(() => []),
  ]);
  const { trail, jsonLd } = breadcrumbs([{ name: 'Careers', path: '/careers' }]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/careers'),
            name: 'Careers',
            description: DESCRIPTION,
            items: careers.map((career) => ({
              name: career.title,
              url: url(`/careers/${career.slug}`),
            })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero eyebrow="Careers" heading="Work at Key Tech Solutions" description={DESCRIPTION} />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="Open roles"
          heading={
            careers.length > 0
              ? `${careers.length} open ${careers.length === 1 ? 'role' : 'roles'}`
              : 'Open roles'
          }
        />
        {careers.length === 0 ? (
          /* An honest empty state beats a placeholder listing. */
          <EmptyState
            title="No roles are open at the moment"
            description="We post roles here as they open. If you think you would be a strong fit regardless, get in touch."
            action={
              <Link href="/contact" style={{ fontWeight: 600 }}>
                Contact us
              </Link>
            }
          />
        ) : (
          <Grid columns={2}>
            {careers.map((career) => (
              <Card key={career.id} href={`/careers/${career.slug}`}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Badge tone="brand">{career.department}</Badge>
                  <Badge tone="neutral">{WORKPLACE_TYPE_LABEL[career.workplaceType]}</Badge>
                  <Badge tone="neutral">{EMPLOYMENT_TYPE_LABEL[career.employmentType]}</Badge>
                </div>
                <CardHeading>{career.title}</CardHeading>
                <CardBody>{career.location}</CardBody>
                <CardFooter>
                  <span
                    style={{ fontSize: 'var(--kt-text-meta)', color: 'var(--kt-text-secondary)' }}
                  >
                    {career.applyDeadline
                      ? `Apply by ${new Date(career.applyDeadline).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}`
                      : 'View role and apply'}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        )}
      </Section>

      {values.length > 0 ? (
        <Section theme="LIGHT">
          <SectionHeader
            eyebrow="How we work"
            heading="What you would be joining"
            description="These are the commitments we hold ourselves to, not aspirations on a wall."
          />
          <ValueGrid values={values} />
        </Section>
      ) : null}

      <Section theme="DARK">
        <CtaPanel
          heading="Nothing open that fits?"
          description="Send us what you do and what you would want to work on. We keep speculative applications on file."
          primaryCta={{ label: 'Contact us', href: '/contact' }}
          onDark
        />
      </Section>
    </>
  );
}
