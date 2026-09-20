import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { CmsPage, cmsPageMetadata } from '@/lib/cms-page';

export const revalidate = CACHE.detail;

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata('cookie-policy', '/cookie-policy');
}

export default function Page() {
  return (
    <CmsPage
      slug="cookie-policy"
      path="/cookie-policy"
      breadcrumbName="Cookie policy"
      schemaType="WebPage"
    />
  );
}
