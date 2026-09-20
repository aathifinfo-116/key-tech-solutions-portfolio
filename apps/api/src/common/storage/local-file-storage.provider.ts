import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { constants } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { isSafeStorageKey } from '@kts/validation';
import { AppConfig } from '../../config/app-config';
import {
  StorageError,
  type SignedUrl,
  type StorageProvider,
  type StoredObject,
} from './storage.interface';

/**
 * Local filesystem storage.
 *
 * Every key is validated and then re-checked after path resolution, so a key
 * can never escape the uploads root even if validation is bypassed upstream.
 * Private objects are served through an API route guarded by an HMAC token
 * that expires; the filesystem itself is never exposed as a static directory.
 */
@Injectable()
export class LocalFileStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalFileStorageProvider.name);
  private readonly root: string;

  constructor(private readonly config: AppConfig) {
    const configured = config.storage.localRoot;
    this.root = isAbsolute(configured) ? normalize(configured) : resolve(process.cwd(), configured);
  }

  /** Resolves a key to an absolute path, refusing anything outside the root. */
  private resolveKey(storageKey: string): string {
    if (!isSafeStorageKey(storageKey)) {
      throw new StorageError('Rejected an unsafe storage key.');
    }
    const target = resolve(this.root, storageKey);
    const rootWithSep = this.root.endsWith(sep) ? this.root : `${this.root}${sep}`;
    if (!target.startsWith(rootWithSep)) {
      throw new StorageError('Rejected a storage key that resolves outside the uploads root.');
    }
    return target;
  }

  async put(storageKey: string, data: Buffer, _contentType: string): Promise<StoredObject> {
    const target = this.resolveKey(storageKey);

    if (await this.exists(storageKey)) {
      // Keys are UUID based, so a collision means something is very wrong.
      throw new StorageError('Refusing to overwrite an existing stored object.');
    }

    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, data, { flag: 'wx' });

    return {
      storageKey,
      sizeBytes: data.byteLength,
      checksum: createHash('sha256').update(data).digest('hex'),
    };
  }

  async get(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveKey(storageKey));
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await access(this.resolveKey(storageKey), constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await rm(this.resolveKey(storageKey), { force: true });
    } catch (error) {
      this.logger.warn(`Failed to delete ${storageKey}: ${(error as Error).message}`);
    }
  }

  publicUrl(storageKey: string): string {
    if (!storageKey.startsWith('public/')) {
      throw new StorageError('Only public objects have a stable public URL.');
    }
    return `${this.config.storage.publicBaseUrl}/${storageKey.slice('public/'.length)}`;
  }

  async signedUrl(storageKey: string, ttlSeconds: number): Promise<SignedUrl> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const expires = Math.floor(expiresAt.getTime() / 1000);
    const signature = this.sign(storageKey, expires);
    const url =
      `${this.config.publicApiUrl}/api/v1/media/private` +
      `?key=${encodeURIComponent(storageKey)}&expires=${expires}&signature=${signature}`;
    return { url, expiresAt };
  }

  /** HMAC over key + expiry, keyed by the session secret. */
  sign(storageKey: string, expiresUnix: number): string {
    return createHmac('sha256', this.config.session.secret)
      .update(`${storageKey}:${expiresUnix}`)
      .digest('hex');
  }

  /** Verifies a signed private-file link in constant time. */
  verifySignature(storageKey: string, expiresUnix: number, signature: string): boolean {
    if (!Number.isFinite(expiresUnix) || expiresUnix * 1000 < Date.now()) return false;
    const expected = this.sign(storageKey, expiresUnix);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
