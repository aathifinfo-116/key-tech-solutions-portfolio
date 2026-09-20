import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { CmsPage, cmsPageMetadata } from '@/lib/cms-page';

export const revalidate = CACHE.detail;

export function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata('contact', '/contact');
}

export default function Page() {
  return (
    <CmsPage slug="contact" path="/contact" breadcrumbName="Contact" schemaType="ContactPage" />
  );
}
