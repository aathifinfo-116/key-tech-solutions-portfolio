import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { IMAGE_VARIANTS, type ImageVariantKey } from '@kts/config';

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
}

export interface GeneratedVariant {
  key: ImageVariantKey;
  data: Buffer;
  width: number;
  height: number;
  extension: 'webp';
  contentType: 'image/webp';
}

export interface ProcessedImage {
  metadata: ImageMetadata;
  variants: GeneratedVariant[];
  blurDataUrl: string;
}

/**
 * Image pipeline.
 *
 * Every upload is re-encoded, which strips EXIF (including GPS coordinates)
 * and neutralises polyglot files that pass a signature check but carry a
 * payload later in the byte stream. Variants are WebP; a tiny blurred preview
 * is inlined as a data URL so cards have a placeholder without an extra request.
 */
@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  async readMetadata(data: Buffer): Promise<ImageMetadata> {
    const meta = await sharp(data).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width <= 0 || height <= 0) {
      throw new Error('The uploaded file could not be read as an image.');
    }
    return {
      width,
      height,
      aspectRatio: Number((width / height).toFixed(4)),
      format: meta.format ?? 'unknown',
    };
  }

  /** Re-encodes the original, stripping metadata but keeping the format. */
  async sanitiseOriginal(data: Buffer, mimeType: string): Promise<Buffer> {
    const pipeline = sharp(data, { failOn: 'error' }).rotate();
    switch (mimeType) {
      case 'image/png':
        return pipeline.png({ compressionLevel: 9 }).toBuffer();
      case 'image/webp':
        return pipeline.webp({ quality: 88 }).toBuffer();
      case 'image/jpeg':
      default:
        return pipeline.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    }
  }

  async process(
    data: Buffer,
    options: { variants?: ImageVariantKey[] } = {},
  ): Promise<ProcessedImage> {
    const metadata = await this.readMetadata(data);
    const wanted = options.variants ?? (Object.keys(IMAGE_VARIANTS) as ImageVariantKey[]);
    const variants: GeneratedVariant[] = [];

    for (const key of wanted) {
      const spec = IMAGE_VARIANTS[key];
      // Never upscale: a 400px logo should not become a blurry 1920px hero.
      if (spec.fit === 'inside' && metadata.width < spec.width && metadata.height < spec.height) {
        continue;
      }
      try {
        const buffer = await sharp(data)
          .rotate()
          .resize({
            width: spec.width,
            height: spec.height,
            fit: spec.fit,
            withoutEnlargement: spec.fit === 'inside',
            position: 'attention',
          })
          .webp({ quality: key === 'thumbnail' ? 78 : 84 })
          .toBuffer({ resolveWithObject: true });

        variants.push({
          key,
          data: buffer.data,
          width: buffer.info.width,
          height: buffer.info.height,
          extension: 'webp',
          contentType: 'image/webp',
        });
      } catch (error) {
        this.logger.warn(`Variant "${key}" could not be generated: ${(error as Error).message}`);
      }
    }

    return { metadata, variants, blurDataUrl: await this.blurPlaceholder(data) };
  }

  /** 16px-wide blurred WebP, inlined as a data URL (typically under 1 KB). */
  async blurPlaceholder(data: Buffer): Promise<string> {
    try {
      const buffer = await sharp(data)
        .rotate()
        .resize(16, 16, { fit: 'inside' })
        .blur(1.2)
        .webp({ quality: 40 })
        .toBuffer();
      return `data:image/webp;base64,${buffer.toString('base64')}`;
    } catch {
      return '';
    }
  }
}
