import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { EMPLOYMENT_TYPE_LABEL, WORKPLACE_TYPE_LABEL } from '@kts/shared-types';
import { jobPostingJsonLd, webPageJsonLd } from '@kts/seo';
import { stripHtml } from '@kts/validation';
import {
  Badge,
  Breadcrumbs,
  CheckList,
  Grid,
  PageHero,
  Prose,
  Section,
  SectionHeader,
} from '@kts/ui';
import { ApplicationForm } from '@/components/forms/ApplicationForm';
import { JsonLd } from '@/components/JsonLd';
import { SITE_NAME, api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.detail;

export async function generateStaticParams() {
  const careers = await api.careers().catch(() => []);
  return careers.map((career) => ({ slug: career.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const career = await api.career(params.slug);
  if (!career)
    return pageMetadata({
      path: `/careers/${params.slug}`,
      title: 'Role not found',
      forceNoIndex: true,
    });

  return pageMetadata({
    path: `/careers/${career.slug}`,
    title: `${career.title} - ${career.location}`,
    description: stripHtml(career.summary).slice(0, 200),
    seo: career.seo,
    publishedTime: career.publishedAt,
    modifiedTime: career.updatedAt,
  });
}

export default async function CareerDetailPage({ params }: { params: { slug: string } }) {
  const career = await api.career(params.slug);
  if (!career) notFound();

  const path = `/careers/${career.slug}`;
  const { trail, jsonLd } = breadcrumbs([
    { name: 'Careers', path: '/careers' },
    { name: career.title, path },
  ]);

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            name: career.title,
            description: stripHtml(career.summary).slice(0, 300),
            datePublished: career.publishedAt,
            dateModified: career.updatedAt,
          }),
          /* JobPosting carries only fields backed by the page: no salary is
             published, so no baseSalary is asserted. */
          jobPostingJsonLd({
            siteUrl: SITE_URL,
            url: url(path),
            title: career.title,
            description: stripHtml(career.summary),
            datePosted: career.publishedAt,
            validThrough: career.applyDeadline,
            employmentType: career.employmentType,
            location: career.location,
            isRemote: career.workplaceType === 'REMOTE',
            organizationName: SITE_NAME,
            department: career.department,
          }),
          jsonLd,
        ]}
      />

      <Breadcrumbs items={trail} />
      <PageHero
        eyebrow={career.department}
        heading={career.title}
        meta={
          <>
            <Badge tone="brand">{career.location}</Badge>
            <Badge tone="neutral">{WORKPLACE_TYPE_LABEL[career.workplaceType]}</Badge>
            <Badge tone="neutral">{EMPLOYMENT_TYPE_LABEL[career.employmentType]}</Badge>
            {career.applyDeadline ? (
              <span>
                Apply by{' '}
                <time dateTime={career.applyDeadline}>
                  {new Date(career.applyDeadline).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              </span>
            ) : null}
          </>
        }
      />

      <Section theme="WHITE">
        <Prose html={career.summary} />
      </Section>

      <Section theme="LIGHT">
        <Grid columns={2}>
          {career.responsibilities.length > 0 ? (
            <div>
              <SectionHeader eyebrow="The role" heading="What you would do" level={2} />
              <CheckList items={career.responsibilities} />
            </div>
          ) : null}
          {career.requirements.length > 0 ? (
            <div>
              <SectionHeader eyebrow="Requirements" heading="What we are looking for" level={2} />
              <CheckList items={career.requirements} />
            </div>
          ) : null}
        </Grid>
      </Section>

      {career.preferredSkills.length > 0 ? (
        <Section theme="WHITE" compact>
          <SectionHeader
            eyebrow="Nice to have"
            heading="Helpful but not required"
            description="Absence of these is not a reason to skip applying."
            level={2}
          />
          <CheckList items={career.preferredSkills} />
        </Section>
      ) : null}

      <Section theme="SOFT_PURPLE" id="apply">
        <SectionHeader
          eyebrow="Apply"
          heading={`Apply for ${career.title}`}
          description="Your CV is stored privately, is never published, and is only opened by the people handling recruitment."
        />
        <ApplicationForm careerSlug={career.slug} roleTitle={career.title} />
      </Section>
    </>
  );
}
