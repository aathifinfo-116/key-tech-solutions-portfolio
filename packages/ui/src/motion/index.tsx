'use client';

/**
 * Motion primitives.
 *
 * Rules these enforce, rather than leave to discipline:
 *  - the content is in the server-rendered HTML before any animation runs,
 *  - `prefers-reduced-motion: reduce` disables movement entirely,
 *  - observers disconnect once an element has revealed, and counters stop
 *    when they leave the viewport, so nothing animates off-screen,
 *  - only opacity and transform are animated, so nothing reflows.
 */

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface RevealProps {
  children: ReactNode;
  /** Stagger, in milliseconds, applied as a CSS transition delay. */
  delay?: number;
  as?: ElementType;
  className?: string;
  /** Fraction of the element that must be visible before revealing. */
  threshold?: number;
}

/**
 * Fades and lifts its children into view once.
 *
 * The default state is *visible*, not hidden. An element only becomes hidden
 * if, after hydration, we have confirmed three things: the browser runs
 * JavaScript, the visitor has not asked for reduced motion, and the element is
 * currently below the fold. Hiding an off-screen element is imperceptible, and
 * it means a failed or slow hydration, a crawler, or a reduced-motion
 * preference all leave the content fully readable.
 *
 * The earlier arrangement - hidden by default, revealed by script - meant any
 * hydration failure left the page blank below the fold. This inversion makes
 * that impossible.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // 'static' = no animation styling at all, so the element is simply visible.
  const [state, setState] = useState<'static' | 'hidden' | 'revealed'>('static');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

    // Already on screen: leave it visible rather than hiding then re-showing.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    setState('hidden');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('revealed');
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref as never}
      className={['kt-reveal', className].filter(Boolean).join(' ')}
      data-reveal={state}
      style={delay ? ({ '--kt-reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

export interface CountUpProps {
  value: number;
  /** Rendered immediately and used verbatim for screen readers. */
  formatted: string;
  durationMs?: number;
  prefix?: string | null;
  suffix?: string | null;
}

/**
 * Counts up to a statistic when it scrolls into view.
 *
 * The final value is in the server-rendered HTML and is what assistive
 * technology announces; the animation is a visual flourish layered on top and
 * is skipped entirely under reduced motion.
 */
export function CountUp({ value, formatted, durationMs = 1400, prefix, suffix }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !Number.isFinite(value) || value <= 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

    let frame = 0;
    let start: number | null = null;
    let running = false;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / durationMs);
      // Ease-out cubic: fast at first, settling at the end.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased).toLocaleString());
      if (progress < 1 && running) {
        frame = requestAnimationFrame(step);
      } else {
        setDisplay(null);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !running) {
            running = true;
            frame = requestAnimationFrame(step);
          } else if (!entry.isIntersecting && running) {
            // Stop work the moment the element leaves the viewport.
            running = false;
            cancelAnimationFrame(frame);
            setDisplay(null);
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {/* aria-hidden on the animating text; the true value is announced below. */}
      <span aria-hidden={display !== null}>{display ?? formatted}</span>
      {display !== null ? <span className="kt-visually-hidden">{formatted}</span> : null}
      {suffix}
    </span>
  );
}
