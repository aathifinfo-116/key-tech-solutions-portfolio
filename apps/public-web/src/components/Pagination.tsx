import Link from 'next/link';
import type { PaginationMeta } from '@kts/shared-types';
import styles from './pagination.module.css';

/**
 * Listing pagination.
 *
 * Real anchors with `?page=N`, so every page of a listing is crawlable and
 * works without JavaScript. `rel="prev"/"next"` state the sequence explicitly.
 */
export function Pagination({ meta, basePath }: { meta: PaginationMeta | null; basePath: string }) {
  if (!meta || meta.totalPages <= 1) return null;

  const href = (page: number) => (page <= 1 ? basePath : `${basePath}?page=${page}`);
  const pages = pageWindow(meta.page, meta.totalPages);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      {meta.hasPrevious ? (
        <Link className={styles.control} href={href(meta.page - 1)} rel="prev">
          <span aria-hidden="true">&larr;</span> Previous
        </Link>
      ) : (
        <span className={`${styles.control} ${styles.disabled}`} aria-disabled="true">
          <span aria-hidden="true">&larr;</span> Previous
        </span>
      )}

      <ol className={styles.pages}>
        {pages.map((page, index) =>
          page === null ? (
            <li key={`gap-${index}`} className={styles.gap} aria-hidden="true">
              &hellip;
            </li>
          ) : (
            <li key={page}>
              <Link
                className={`${styles.page} ${page === meta.page ? styles.current : ''}`}
                href={href(page)}
                aria-current={page === meta.page ? 'page' : undefined}
              >
                <span className="kt-visually-hidden">Page </span>
                {page}
              </Link>
            </li>
          ),
        )}
      </ol>

      {meta.hasNext ? (
        <Link className={styles.control} href={href(meta.page + 1)} rel="next">
          Next <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : (
        <span className={`${styles.control} ${styles.disabled}`} aria-disabled="true">
          Next <span aria-hidden="true">&rarr;</span>
        </span>
      )}
    </nav>
  );
}

/** First, last, and a window around the current page, with gaps marked null. */
function pageWindow(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const output: Array<number | null> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) output.push(null);
    output.push(page);
    previous = page;
  }
  return output;
}
