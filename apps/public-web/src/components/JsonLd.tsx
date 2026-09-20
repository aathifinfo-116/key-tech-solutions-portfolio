import type { JsonLd as JsonLdType } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/seo';

/**
 * Renders JSON-LD into the server-rendered HTML.
 *
 * The payload is serialised with `<` escaped, so no value can close the script
 * element early. Structured data is emitted on the server precisely so a
 * crawler sees it without executing JavaScript.
 */
export function JsonLd({ data }: { data: JsonLdType | JsonLdType[] | null }) {
  const payload = serializeJsonLd(data);
  if (!payload) return null;
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
