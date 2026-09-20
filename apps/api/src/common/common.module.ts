import { Global, Module } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { AuditService } from './audit/audit.service';
import { SessionService } from './auth/session.service';
import { MailService } from './mail/mail.service';
import { PrismaService } from './prisma/prisma.service';
import { RevalidationService } from './revalidation/revalidation.service';
import { ImageProcessorService } from './storage/image-processor.service';
import { LocalFileStorageProvider } from './storage/local-file-storage.provider';
import { S3StorageProvider } from './storage/s3-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage.interface';

/**
 * Cross-cutting infrastructure, available to every feature module.
 *
 * The storage provider is chosen once here from STORAGE_DRIVER; nothing
 * downstream knows whether bytes land on disk or in a bucket.
 */
@Global()
@Module({
  providers: [
    { provide: AppConfig, useFactory: () => new AppConfig() },
    PrismaService,
    AuditService,
    SessionService,
    MailService,
    RevalidationService,
    ImageProcessorService,
    LocalFileStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [AppConfig, LocalFileStorageProvider],
      useFactory: (config: AppConfig, local: LocalFileStorageProvider): StorageProvider =>
        config.storage.driver === 's3' ? new S3StorageProvider(config) : local,
    },
  ],
  exports: [
    AppConfig,
    PrismaService,
    AuditService,
    SessionService,
    MailService,
    RevalidationService,
    ImageProcessorService,
    LocalFileStorageProvider,
    STORAGE_PROVIDER,
  ],
})
export class CommonModule {}
