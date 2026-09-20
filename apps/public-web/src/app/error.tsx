'use client';

import { useEffect } from 'react';
import { Button, ButtonLink, ButtonRow, Container, Section, SectionHeader } from '@kts/ui';

/**
 * Route error boundary.
 *
 * Shows the visitor a plain message and the digest they can quote. The actual
 * error text and stack stay server side; nothing internal is rendered here.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged to the browser console only; the server already logged the cause.
    console.error('Route error', error.digest ?? '(no digest)');
  }, [error]);

  return (
    <Section theme="WHITE">
      <Container width="narrow">
        <SectionHeader
          eyebrow="Something went wrong"
          heading="This page could not be loaded"
          description="The problem has been logged. Trying again often resolves it; if it does not, let us know and quote the reference below."
          level={1}
        />
        {error.digest ? (
          <p
            style={{
              fontFamily: 'var(--kt-font-mono)',
              fontSize: 'var(--kt-text-small)',
              color: 'var(--kt-text-secondary)',
            }}
          >
            Reference: {error.digest}
          </p>
        ) : null}
        <ButtonRow>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Back to the homepage
          </ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Report it
          </ButtonLink>
        </ButtonRow>
      </Container>
    </Section>
  );
}
