/**
 * Image rendering for DTO-backed media.
 *
 * Every image gets explicit dimensions or `fill` with a sized parent, so
 * nothing shifts as it loads. Only the LCP image is given `priority`; the rest
 * are lazy by default. When no media exists a placeholder of the same aspect
 * ratio is rendered, so an unfinished page never collapses or shows a broken
 * image icon.
 */

import Image from 'next/image';
import type { MediaAssetDto } from '@kts/shared-types';
import { MediaFrame, MediaPlaceholder } from '../primitives';

export interface SmartImageProps {
  media: MediaAssetDto | null | undefined;
  /** Falls back to the asset's stored alt text; '' marks it decorative. */
  alt?: string;
  /** Which stored variant to request. */
  variant?: 'thumbnail' | 'card' | 'hero' | 'original';
  sizes?: string;
  priority?: boolean;
  /** Aspect ratio for the frame and for the placeholder, e.g. '16 / 9'. */
  ratio?: string;
  className?: string;
  placeholderLabel?: string;
  branded?: boolean;
}

export function SmartImage({
  media,
  alt,
  variant = 'card',
  sizes = '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 600px',
  priority = false,
  ratio = '4 / 3',
  className,
  placeholderLabel,
  branded,
}: SmartImageProps) {
  if (!media) {
    return (
      <MediaFrame branded={branded} className={className}>
        <MediaPlaceholder
          label={placeholderLabel ?? alt ?? 'Image not yet uploaded'}
          ratio={ratio}
        />
      </MediaFrame>
    );
  }

  const src = media.variants[variant] ?? media.variants.original;
  // An empty alt is a deliberate "decorative" signal and must be preserved.
  const altText = alt !== undefined ? alt : (media.altText ?? '');

  return (
    <MediaFrame branded={branded} className={className}>
      <div style={{ position: 'relative', aspectRatio: ratio, width: '100%' }}>
        <Image
          src={src}
          alt={altText}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          placeholder={media.blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={media.blurDataUrl ?? undefined}
          style={{
            objectFit: 'cover',
            objectPosition: `${media.focalPoint.x * 100}% ${media.focalPoint.y * 100}%`,
          }}
        />
      </div>
    </MediaFrame>
  );
}

/**
 * A small square image (logo, avatar) with intrinsic dimensions rather than
 * `fill`, because the size is known and a wrapper would be wasted markup.
 */
export function SmartAvatar({
  media,
  alt,
  size = 56,
  className,
}: {
  media: MediaAssetDto | null | undefined;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!media) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--kt-gradient-brand)',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          fontWeight: 600,
          fontSize: size * 0.36,
          flex: 'none',
        }}
        aria-hidden="true"
      >
        {initials(alt)}
      </div>
    );
  }

  return (
    <Image
      className={className}
      src={media.variants.thumbnail ?? media.variants.original}
      alt={alt}
      width={size}
      height={size}
      sizes={`${size}px`}
      style={{ borderRadius: '50%', objectFit: 'cover', flex: 'none' }}
    />
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** A logo rendered at a known height, letting width follow the aspect ratio. */
export function SmartLogo({
  media,
  alt,
  height = 32,
  className,
}: {
  media: MediaAssetDto | null | undefined;
  alt: string;
  height?: number;
  className?: string;
}) {
  if (!media) return null;
  const width = media.aspectRatio ? Math.round(height * media.aspectRatio) : height * 3;
  return (
    <Image
      className={className}
      src={media.variants.thumbnail ?? media.variants.original}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: 'contain', height, width: 'auto' }}
    />
  );
}
