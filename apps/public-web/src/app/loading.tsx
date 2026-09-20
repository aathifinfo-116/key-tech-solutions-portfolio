import { Container, Section } from '@kts/ui';

/**
 * Route-level loading state.
 * A branded skeleton rather than a spinner, so the page does not jump when
 * the real content arrives.
 */
export default function Loading() {
  return (
    <Section theme="WHITE">
      <Container>
        <div
          style={{ display: 'grid', gap: 'var(--kt-space-4)' }}
          aria-busy="true"
          aria-live="polite"
        >
          <span className="kt-visually-hidden">Loading content</span>
          <span className="kt-keyline" aria-hidden="true" />
          <div
            style={{
              height: 40,
              maxWidth: 420,
              borderRadius: 10,
              background: 'var(--kt-surface-muted)',
            }}
          />
          <div
            style={{
              height: 20,
              maxWidth: 620,
              borderRadius: 8,
              background: 'var(--kt-surface-muted)',
            }}
          />
          <div
            style={{
              height: 20,
              maxWidth: 540,
              borderRadius: 8,
              background: 'var(--kt-surface-muted)',
            }}
          />
          <div
            style={{
              marginTop: 'var(--kt-space-5)',
              display: 'grid',
              gap: 'var(--kt-space-5)',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            }}
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                style={{
                  height: 220,
                  borderRadius: 'var(--kt-radius-lg)',
                  background: 'var(--kt-surface-muted)',
                }}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
