import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { MediaAssetDto, Paginated } from '@kts/shared-types';
import { UPLOAD } from '@kts/config';
import { buildStorageKey, buildVariantKey, validateUpload } from '@kts/validation';
import { AppConfig } from '../../config/app-config';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ImageProcessorService } from '../../common/storage/image-processor.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import { mapMedia } from '../../common/utils/mappers';
import {
  buildSearchWhere,
  normalisePaging,
  paginate,
  toSkipTake,
} from '../../common/utils/pagination';
import type { CrudContext, CrudListQuery } from '../../common/crud/crud.types';

export interface IncomingFile {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Media and document handling.
 *
 * An upload is accepted only if extension, declared MIME type and magic bytes
 * all agree. Images are re-encoded (which strips EXIF and neutralises polyglot
 * files) and stored under a UUID filename, so the visitor's filename never
 * touches the filesystem. Documents are stored privately and are reachable
 * only through a short-lived signed link issued to an authorised admin.
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly images: ImageProcessorService,
    private readonly config: AppConfig,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  private resolver = {
    publicUrl: (storageKey: string): string => this.storage.publicUrl(storageKey),
  };

  private assert(ctx: CrudContext, permission: string): void {
    if (!ctx.user.permissions.includes(permission)) {
      throw new ForbiddenException(
        `Your role does not include the required permission: ${permission}.`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Images
  // -------------------------------------------------------------------------

  async uploadImage(
    file: IncomingFile,
    options: {
      folder: string;
      altText?: string;
      caption?: string;
      kind?: 'IMAGE' | 'LOGO' | 'ICON' | 'SCREENSHOT' | 'OPEN_GRAPH';
    },
    ctx: CrudContext,
  ): Promise<MediaAssetDto> {
    this.assert(ctx, 'media:create');

    const validation = validateUpload(
      {
        originalName: file.filename,
        declaredMimeType: file.mimetype,
        sizeBytes: file.buffer.byteLength,
        head: new Uint8Array(file.buffer.subarray(0, 32)),
      },
      { category: 'image', folder: options.folder, maxBytes: this.config.storage.maxImageBytes },
    );

    if (!validation.ok || !validation.resolved) {
      throw new UnprocessableEntityException({
        message: 'The file was rejected.',
        details: validation.errors.map((message) => ({ path: 'file', message })),
      });
    }

    const { extension, mimeType } = validation.resolved;

    // Re-encoding is what actually makes an upload safe: whatever extra bytes
    // were smuggled past the signature check do not survive a decode/encode.
    let sanitised: Buffer;
    let processed;
    try {
      sanitised = await this.images.sanitiseOriginal(file.buffer, mimeType);
      processed = await this.images.process(sanitised);
    } catch {
      throw new UnprocessableEntityException('The file could not be decoded as an image.');
    }

    const { width, height } = processed.metadata;
    if (width > UPLOAD.image.maxWidth || height > UPLOAD.image.maxHeight) {
      throw new PayloadTooLargeException(
        `Image dimensions ${width}x${height} exceed the ${UPLOAD.image.maxWidth}x${UPLOAD.image.maxHeight} limit.`,
      );
    }
    if (width < UPLOAD.image.minWidth || height < UPLOAD.image.minHeight) {
      throw new UnprocessableEntityException('That image is too small to be useful.');
    }

    const id = randomUUID();
    const storageKey = buildStorageKey({
      visibility: 'public',
      folder: options.folder,
      uuid: id,
      extension,
    });
    const stored = await this.storage.put(storageKey, sanitised, mimeType);

    const variantKeys: Record<string, string> = {};
    for (const variant of processed.variants) {
      const key = buildVariantKey(storageKey, variant.key, 'webp');
      await this.storage.put(key, variant.data, variant.contentType);
      variantKeys[variant.key] = key;
    }

    const asset = await this.prisma.mediaAsset.create({
      data: {
        id,
        storageKey,
        originalName: file.filename.slice(0, UPLOAD.maxFilenameLength),
        generatedName: `${id}.${extension}`,
        mimeType,
        extension,
        kind: options.kind ?? 'IMAGE',
        visibility: 'PUBLIC',
        folder: options.folder,
        sizeBytes: stored.sizeBytes,
        width,
        height,
        aspectRatio: processed.metadata.aspectRatio,
        blurDataUrl: processed.blurDataUrl || null,
        altText: options.altText?.slice(0, 300) ?? null,
        caption: options.caption?.slice(0, 400) ?? null,
        checksum: stored.checksum,
        variants: variantKeys,
        uploadedById: ctx.user.id,
      },
    });

    await this.audit.record({
      action: 'UPLOAD',
      entityType: 'MEDIA_ASSET',
      entityId: asset.id,
      entityLabel: asset.originalName,
      summary: `${options.folder} / ${width}x${height} / ${Math.round(stored.sizeBytes / 1024)} KB`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return mapMedia(asset, this.resolver) as MediaAssetDto;
  }

  async listAssets(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<MediaAssetDto>> {
    this.assert(ctx, 'media:read');
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where: Record<string, unknown> = { visibility: 'PUBLIC' };
    if (!query.includeArchived) where.archivedAt = null;
    if (query.folder) where.folder = query.folder;
    if (query.kind) where.kind = query.kind;
    const search = buildSearchWhere(query.search, ['originalName', 'altText', 'caption']);
    if (search) Object.assign(where, search);

    const [rows, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return paginate(
      rows
        .map((row) => mapMedia(row, this.resolver))
        .filter((row): row is MediaAssetDto => row !== null),
      paging,
      total,
    );
  }

  async updateAsset(
    id: string,
    input: {
      altText?: string;
      caption?: string;
      focalX?: number;
      focalY?: number;
      folder?: string;
    },
    ctx: CrudContext,
  ): Promise<MediaAssetDto> {
    this.assert(ctx, 'media:update');
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: {
        altText: input.altText,
        caption: input.caption,
        focalX: input.focalX,
        focalY: input.focalY,
      },
    });
    await this.audit.record({
      action: 'UPDATE',
      entityType: 'MEDIA_ASSET',
      entityId: id,
      entityLabel: asset.originalName,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    return mapMedia(asset, this.resolver) as MediaAssetDto;
  }

  /**
   * Archives an asset rather than deleting the bytes, so a page that still
   * references it degrades to a placeholder instead of a broken image.
   */
  async archiveAsset(id: string, ctx: CrudContext): Promise<void> {
    this.assert(ctx, 'media:delete');
    const usages = await this.prisma.mediaUsage.count({ where: { mediaId: id } });
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await this.audit.record({
      action: 'ARCHIVE',
      entityType: 'MEDIA_ASSET',
      entityId: id,
      entityLabel: asset.originalName,
      summary: usages > 0 ? `Still referenced by ${usages} record(s)` : 'No remaining references',
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
  }

  // -------------------------------------------------------------------------
  // Documents
  // -------------------------------------------------------------------------

  async uploadDocument(
    file: IncomingFile,
    options: {
      folder: 'leads' | 'careers' | 'documents';
      kind: 'LEAD_ATTACHMENT' | 'CV' | 'BROCHURE' | 'CASE_STUDY_DOWNLOAD' | 'GENERAL';
      title?: string;
      uploadedById?: string | null;
    },
  ): Promise<{ id: string; originalName: string; sizeBytes: number }> {
    const validation = validateUpload(
      {
        originalName: file.filename,
        declaredMimeType: file.mimetype,
        sizeBytes: file.buffer.byteLength,
        head: new Uint8Array(file.buffer.subarray(0, 32)),
      },
      {
        category: 'document',
        folder: options.folder,
        maxBytes: this.config.storage.maxDocumentBytes,
      },
    );

    if (!validation.ok || !validation.resolved) {
      throw new UnprocessableEntityException({
        message: 'The file was rejected.',
        details: validation.errors.map((message) => ({ path: 'file', message })),
      });
    }

    const { extension, mimeType } = validation.resolved;
    const id = randomUUID();
    const storageKey = buildStorageKey({
      visibility: 'private',
      folder: options.folder,
      uuid: id,
      extension,
    });
    const stored = await this.storage.put(storageKey, file.buffer, mimeType);

    const document = await this.prisma.documentAsset.create({
      data: {
        id,
        storageKey,
        originalName: file.filename.slice(0, UPLOAD.maxFilenameLength),
        generatedName: `${id}.${extension}`,
        mimeType,
        extension,
        kind: options.kind,
        visibility: 'PRIVATE',
        folder: options.folder,
        sizeBytes: stored.sizeBytes,
        title: options.title?.slice(0, 200) ?? null,
        checksum: stored.checksum,
        uploadedById: options.uploadedById ?? null,
      },
    });

    return { id: document.id, originalName: document.originalName, sizeBytes: document.sizeBytes };
  }

  /**
   * Issues a signed, expiring URL for a private document.
   * The permission check happens here, at link-issue time; the link itself is
   * then valid for five minutes and for that one object only.
   */
  async createDocumentLink(
    id: string,
    ctx: CrudContext,
  ): Promise<{ url: string; expiresAt: string }> {
    this.assert(ctx, 'documents:download');

    const document = await this.prisma.documentAsset.findUnique({ where: { id } });
    if (!document || document.archivedAt)
      throw new NotFoundException('That document does not exist.');

    // CVs carry an extra gate: only roles that process applications may read them.
    if (document.kind === 'CV' && !ctx.user.permissions.includes('applications:download')) {
      throw new ForbiddenException(
        'Reading applicant CVs requires the applications:download permission.',
      );
    }

    const signed = await this.storage.signedUrl(document.storageKey, 300);

    await this.audit.record({
      action: 'DOWNLOAD',
      entityType: 'DOCUMENT_ASSET',
      entityId: id,
      entityLabel: document.originalName,
      summary: `Signed link issued (${document.kind})`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return { url: signed.url, expiresAt: signed.expiresAt.toISOString() };
  }

  // -------------------------------------------------------------------------
  // Serving
  // -------------------------------------------------------------------------

  /**
   * Reads a public object by its path under `public/`.
   * The key is forced into the public namespace and then validated by the
   * storage provider, so a crafted path cannot reach `private/` or escape the
   * uploads root. A miss is a 404, never a filesystem error.
   */
  async readPublicObject(relativeKey: string): Promise<{ data: Buffer; contentType: string }> {
    const storageKey = `public/${relativeKey.replace(/^\/+/, '')}`;
    try {
      const data = await this.storage.get(storageKey);
      return { data, contentType: contentTypeFor(relativeKey) };
    } catch {
      throw new NotFoundException('File not found.');
    }
  }

  async readPrivateObject(
    storageKey: string,
  ): Promise<{ data: Buffer; contentType: string; filename: string }> {
    if (!storageKey.startsWith('private/')) {
      throw new BadRequestException('That key is not a private object.');
    }
    const document = await this.prisma.documentAsset.findFirst({ where: { storageKey } });
    if (!document) throw new NotFoundException('File not found.');

    const data = await this.storage.get(storageKey);
    return { data, contentType: document.mimeType, filename: document.originalName };
  }
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function contentTypeFor(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}
