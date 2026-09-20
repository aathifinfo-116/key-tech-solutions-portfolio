import type { Metadata } from 'next';
import { CACHE } from '@kts/config';
import { collectionPageJsonLd } from '@kts/seo';
import { Breadcrumbs, CtaPanel, PageHero, ProductGrid, Section, SectionHeader } from '@kts/ui';
import { JsonLd } from '@/components/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL, breadcrumbs, pageMetadata, url } from '@/lib/seo';

export const revalidate = CACHE.listing;

const TITLE = 'Key Tech products';
const DESCRIPTION =
  'Key Tech Solutions is the parent organisation behind the Key product family: KeySportsBooking for sports venue booking and KeyAutoParts for automotive parts catalogues.';

export function generateMetadata(): Metadata {
  return pageMetadata({ path: '/products', title: 'Products', description: DESCRIPTION });
}

export default async function ProductsPage() {
  const products = await api.products({ pageSize: 50 }).catch(() => ({ items: [], meta: null }));
  const { trail, jsonLd } = breadcrumbs([{ name: 'Products', path: '/products' }]);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            siteUrl: SITE_URL,
            url: url('/products'),
            name: TITLE,
            description: DESCRIPTION,
            items: products.items.map((product) => ({
              name: product.name,
              url: url(`/products/${product.slug}`),
            })),
          }),
          jsonLd,
        ]}
      />
      <Breadcrumbs items={trail} />
      <PageHero eyebrow="The Key family" heading={TITLE} description={DESCRIPTION} />

      <Section theme="WHITE">
        <SectionHeader
          eyebrow="Products"
          heading="What we are building"
          description="Each product page states its current development status plainly. Where a capability is planned rather than delivered, it says so."
        />
        <ProductGrid products={products.items} />
      </Section>

      <Section theme="LIGHT">
        <SectionHeader
          eyebrow="Why we build our own"
          heading="Running products changes how we advise on them"
          description="Living with our own architecture decisions, migrations and support burden makes us more careful about the ones we recommend to other people."
        />
      </Section>

      <Section theme="DARK">
        <CtaPanel
          heading="Want something like this for your business?"
          description="The same team and the same foundations are available as a service."
          primaryCta={{ label: 'Start a Project', href: '/request-a-quote' }}
          secondaryCta={{ label: 'See our services', href: '/services' }}
          onDark
        />
      </Section>
    </>
  );
}
