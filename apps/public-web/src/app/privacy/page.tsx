import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { CmsPage, cmsPageMetadata } from '@/lib/cms-page';

export const revalidate = CACHE.detail;

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata('privacy', '/privacy');
}

export default function Page() {
  return (
    <CmsPage slug="privacy" path="/privacy" breadcrumbName="Privacy policy" schemaType="WebPage" />
  );
}
