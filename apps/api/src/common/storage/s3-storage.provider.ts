import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../config/app-config';
import {
  StorageError,
  type SignedUrl,
  type StorageProvider,
  type StoredObject,
} from './storage.interface';

/**
 * S3-compatible storage provider (scaffold).
 *
 * The interface, configuration surface and wiring are in place so switching is
 * a matter of adding `@aws-sdk/client-s3` and filling in these five methods -
 * no business service changes. It is deliberately not implemented yet: adding
 * an unused AWS SDK to the dependency tree buys nothing today, and a provider
 * that silently half-works is worse than one that refuses to start.
 *
 * To enable: `pnpm --filter @kts/api add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`,
 * implement the methods below, and set STORAGE_DRIVER=s3 with the S3_* variables.
 */
@Injectable()
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';
  private readonly logger = new Logger(S3StorageProvider.name);

  constructor(private readonly config: AppConfig) {
    const { bucket, region } = config.storage.s3;
    if (!bucket || !region) {
      throw new StorageError(
        'STORAGE_DRIVER=s3 requires S3_BUCKET and S3_REGION. Credentials are read from the environment or the instance role.',
      );
    }
    this.logger.warn('S3 storage provider selected but not yet implemented.');
  }

  private notImplemented(operation: string): never {
    throw new StorageError(
      `S3 storage is not implemented yet (${operation}). Use STORAGE_DRIVER=local, or implement S3StorageProvider.`,
    );
  }

  put(_storageKey: string, _data: Buffer, _contentType: string): Promise<StoredObject> {
    this.notImplemented('put');
  }

  get(_storageKey: string): Promise<Buffer> {
    this.notImplemented('get');
  }

  exists(_storageKey: string): Promise<boolean> {
    this.notImplemented('exists');
  }

  delete(_storageKey: string): Promise<void> {
    this.notImplemented('delete');
  }

  publicUrl(storageKey: string): string {
    const { bucket, region, endpoint } = this.config.storage.s3;
    const base = endpoint?.replace(/\/+$/, '') ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    return `${base}/${storageKey}`;
  }

  signedUrl(_storageKey: string, _ttlSeconds: number): Promise<SignedUrl> {
    this.notImplemented('signedUrl');
  }
}
