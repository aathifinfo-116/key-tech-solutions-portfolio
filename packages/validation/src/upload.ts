/**
 * Upload validation.
 *
 * Extension, declared MIME type and the file's own magic bytes must all agree
 * before a file is written to disk. The browser's Content-Type header is never
 * trusted on its own.
 */

import {
  FILE_SIGNATURES,
  FORBIDDEN_UPLOAD_EXTENSIONS,
  PRIVATE_DOCUMENT_FOLDERS,
  PUBLIC_MEDIA_FOLDERS,
  UPLOAD,
} from '@kts/config';

export type UploadCategory = 'image' | 'document';

export interface UploadCandidate {
  originalName: string;
  /** Content-Type reported by the browser. Advisory only. */
  declaredMimeType: string;
  sizeBytes: number;
  /** First bytes of the file; at least 16 bytes are needed for a reliable check. */
  head: Uint8Array;
}

export interface UploadValidationOptions {
  category: UploadCategory;
  folder: string;
  maxBytes?: number;
}

export interface UploadValidationResult {
  ok: boolean;
  errors: string[];
  /** Resolved values, present only when `ok` is true. */
  resolved?: {
    extension: string;
    mimeType: string;
    safeBaseName: string;
  };
}

const EXTENSION_ALIASES: Record<string, string> = { jpeg: 'jpg' };

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Extracts every dot-separated extension, lowercased, e.g. "a.php.jpg" -> [php, jpg]. */
export function extractExtensions(filename: string): string[] {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const parts = base.split('.').slice(1);
  return parts.map((p) => p.toLowerCase().trim()).filter(Boolean);
}

/** True when the filename attempts directory traversal or is otherwise unsafe. */
export function hasPathTraversal(filename: string): boolean {
  return (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('\0') ||
    /^[a-zA-Z]:/.test(filename)
  );
}

/** Verifies the file's leading bytes match the expected signature for `mimeType`. */
export function matchesSignature(head: Uint8Array, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;
  return signatures.every(({ offset, bytes }) =>
    bytes.every((byte, index) => head[offset + index] === byte),
  );
}

export function validateUpload(
  candidate: UploadCandidate,
  options: UploadValidationOptions,
): UploadValidationResult {
  const errors: string[] = [];
  const spec = options.category === 'image' ? UPLOAD.image : UPLOAD.document;
  const maxBytes = options.maxBytes ?? spec.maxBytesDefault;

  const rawName = candidate.originalName ?? '';
  if (!rawName.trim()) errors.push('A file name is required.');
  if (rawName.length > UPLOAD.maxFilenameLength) {
    errors.push(`File name must be ${UPLOAD.maxFilenameLength} characters or fewer.`);
  }
  if (hasPathTraversal(rawName)) errors.push('File name contains path characters.');

  const allowedFolders: readonly string[] =
    options.category === 'image' ? PUBLIC_MEDIA_FOLDERS : PRIVATE_DOCUMENT_FOLDERS;
  if (!allowedFolders.includes(options.folder)) {
    errors.push(`Folder "${options.folder}" is not an allowed ${options.category} destination.`);
  }

  if (!Number.isFinite(candidate.sizeBytes) || candidate.sizeBytes <= 0) {
    errors.push('File is empty.');
  } else if (candidate.sizeBytes > maxBytes) {
    errors.push(`File is larger than the ${Math.round(maxBytes / (1024 * 1024))} MB limit.`);
  }

  const extensions = extractExtensions(rawName);
  if (extensions.length === 0) errors.push('File must have an extension.');

  const forbidden = extensions.filter((ext) =>
    (FORBIDDEN_UPLOAD_EXTENSIONS as readonly string[]).includes(ext),
  );
  if (forbidden.length > 0) {
    errors.push(`Disallowed file type: .${forbidden.join(', .')}`);
  }

  const finalExtRaw = extensions[extensions.length - 1] ?? '';
  const finalExt = EXTENSION_ALIASES[finalExtRaw] ?? finalExtRaw;
  const allowedExtensions: readonly string[] = spec.extensions;
  if (
    finalExt &&
    !allowedExtensions.includes(finalExtRaw) &&
    !allowedExtensions.includes(finalExt)
  ) {
    errors.push(`Only ${allowedExtensions.join(', ')} files are accepted here.`);
  }

  // Extra extensions before the final one are a classic bypass attempt.
  if (extensions.length > 1) {
    errors.push('File name contains more than one extension.');
  }

  const expectedMime = MIME_BY_EXTENSION[finalExtRaw];
  const allowedMimes: readonly string[] = spec.mimeTypes;
  const declared = (candidate.declaredMimeType || '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (!expectedMime) {
    errors.push('Unrecognised file extension.');
  } else {
    if (declared && declared !== expectedMime) {
      errors.push('Declared content type does not match the file extension.');
    }
    if (!allowedMimes.includes(expectedMime)) {
      errors.push(`Content type ${expectedMime} is not accepted here.`);
    }
    if (!matchesSignature(candidate.head, expectedMime)) {
      errors.push('File content does not match its extension.');
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const safeBaseName =
    (rawName.split('.')[0] ?? 'file')
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .trim()
      .slice(0, 80) || 'file';

  return {
    ok: true,
    errors: [],
    resolved: { extension: finalExtRaw, mimeType: expectedMime as string, safeBaseName },
  };
}

/**
 * Builds the storage key for an upload: `<visibility>/<folder>/<uuid>.<ext>`.
 * The UUID (never the user's filename) is what lands on disk, so collisions and
 * overwrites are impossible and the original name stays metadata only.
 */
export function buildStorageKey(params: {
  visibility: 'public' | 'private';
  folder: string;
  uuid: string;
  extension: string;
}): string {
  const folder = params.folder.replace(/[^a-z0-9-]/gi, '');
  const ext = params.extension.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return `${params.visibility}/${folder}/${params.uuid}.${ext}`;
}

/**
 * Storage key for a generated image variant, e.g.
 * `public/products/<uuid>-thumbnail.webp`.
 */
export function buildVariantKey(originalKey: string, variant: string, extension = 'webp'): string {
  const withoutExt = originalKey.replace(/\.[a-z0-9]+$/i, '');
  const safeVariant = variant.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${withoutExt}-${safeVariant}.${extension}`;
}

/**
 * Rejects any storage key that could escape the uploads root.
 * Accepts both originals (`<uuid>.<ext>`) and variants (`<uuid>-<name>.<ext>`).
 */
export function isSafeStorageKey(key: string): boolean {
  if (
    !key ||
    key.startsWith('/') ||
    key.includes('..') ||
    key.includes('\\') ||
    key.includes('\0')
  ) {
    return false;
  }
  return /^(public|private|temp)\/[a-z0-9-]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-[a-z0-9]{1,20})?\.[a-z0-9]{2,5}$/i.test(
    key,
  );
}
