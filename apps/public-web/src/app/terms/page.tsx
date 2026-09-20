import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { CmsPage, cmsPageMetadata } from '@/lib/cms-page';

export const revalidate = CACHE.detail;

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata('terms', '/terms');
}

export default function Page() {
  return <CmsPage slug="terms" path="/terms" breadcrumbName="Terms of use" schemaType="WebPage" />;
}
