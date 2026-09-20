import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { CmsPage, cmsPageMetadata } from '@/lib/cms-page';

export const revalidate = CACHE.detail;

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata('request-a-quote', '/request-a-quote');
}

export default function Page() {
  return (
    <CmsPage
      slug="request-a-quote"
      path="/request-a-quote"
      breadcrumbName="Request a quote"
      schemaType="WebPage"
    />
  );
}
