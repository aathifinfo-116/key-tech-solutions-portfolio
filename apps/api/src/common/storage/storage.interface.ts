/**
 * Storage abstraction.
 *
 * Business services depend on this interface, never on a filesystem path, so
 * moving from local disk to S3 is a provider swap with no call-site changes.
 */

export interface StoredObject {
  storageKey: string;
  sizeBytes: number;
  checksum: string;
}

export interface SignedUrl {
  url: string;
  expiresAt: Date;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StorageProvider {
  readonly name: string;

  /** Writes bytes at `storageKey`. Refuses to overwrite an existing object. */
  put(storageKey: string, data: Buffer, contentType: string): Promise<StoredObject>;

  get(storageKey: string): Promise<Buffer>;

  exists(storageKey: string): Promise<boolean>;

  delete(storageKey: string): Promise<void>;

  /** Stable public URL. Only valid for keys under `public/`. */
  publicUrl(storageKey: string): string;

  /**
   * Short-lived authorised URL for a private object.
   * Local storage returns an API route carrying a signed, expiring token.
   */
  signedUrl(storageKey: string, ttlSeconds: number): Promise<SignedUrl>;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}
