import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { listQuerySchema, mediaUpdateSchema } from '@kts/validation';
import { PRIVATE_DOCUMENT_FOLDERS, PUBLIC_MEDIA_FOLDERS } from '@kts/config';
import type { SessionUserDto } from '@kts/shared-types';
import { Public, RequirePermissions } from '../../common/auth/auth.decorators';
import { CurrentUser, Meta, type RequestMeta } from '../../common/http/request-context';
import { LocalFileStorageProvider } from '../../common/storage/local-file-storage.provider';
import { AppConfig } from '../../config/app-config';
import { MediaService, type IncomingFile } from './media.service';

@Controller('api/v1/media')
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly localStorage: LocalFileStorageProvider,
    private readonly config: AppConfig,
  ) {}

  private ctx(user: SessionUserDto, meta: RequestMeta) {
    return { user, meta };
  }

  private async readFile(
    request: FastifyRequest,
  ): Promise<{ file: IncomingFile; fields: Record<string, string> }> {
    const part = await request.file({ limits: { files: 1 } });
    if (!part) throw new BadRequestException('No file was supplied.');

    const buffer = await part.toBuffer();
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(part.fields ?? {})) {
      if (
        value &&
        typeof value === 'object' &&
        'value' in value &&
        typeof value.value === 'string'
      ) {
        fields[key] = value.value;
      }
    }

    return {
      file: { filename: part.filename, mimetype: part.mimetype, buffer },
      fields,
    };
  }

  // ---- admin image library ------------------------------------------------

  @Post('upload')
  @RequirePermissions('media:create')
  async upload(
    @Req() request: FastifyRequest,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    const { file, fields } = await this.readFile(request);
    const folder = fields.folder ?? 'content';
    if (!(PUBLIC_MEDIA_FOLDERS as readonly string[]).includes(folder)) {
      throw new BadRequestException(`Unknown media folder "${folder}".`);
    }
    return this.media.uploadImage(
      file,
      {
        folder,
        altText: fields.altText,
        caption: fields.caption,
        kind: (fields.kind as 'IMAGE' | 'LOGO' | 'ICON' | 'SCREENSHOT' | 'OPEN_GRAPH') ?? 'IMAGE',
      },
      this.ctx(user, meta),
    );
  }

  @Get('assets')
  @RequirePermissions('media:read')
  listAssets(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.media.listAssets(
      listQuerySchema.passthrough().parse(query ?? {}),
      this.ctx(user, meta),
    );
  }

  @Patch('assets/:id')
  @RequirePermissions('media:update')
  updateAsset(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.media.updateAsset(id, mediaUpdateSchema.parse(body ?? {}), this.ctx(user, meta));
  }

  @Delete('assets/:id')
  @HttpCode(204)
  @RequirePermissions('media:delete')
  async archiveAsset(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    await this.media.archiveAsset(id, this.ctx(user, meta));
  }

  // ---- private documents --------------------------------------------------

  @Post('documents')
  @RequirePermissions('documents:create')
  async uploadDocument(@Req() request: FastifyRequest, @CurrentUser() user: SessionUserDto) {
    const { file, fields } = await this.readFile(request);
    const folder = (fields.folder ?? 'documents') as 'leads' | 'careers' | 'documents';
    if (!(PRIVATE_DOCUMENT_FOLDERS as readonly string[]).includes(folder)) {
      throw new BadRequestException(`Unknown document folder "${folder}".`);
    }
    return this.media.uploadDocument(file, {
      folder,
      kind: (fields.kind as 'GENERAL') ?? 'GENERAL',
      title: fields.title,
      uploadedById: user.id,
    });
  }

  @Post('documents/:id/link')
  @RequirePermissions('documents:download')
  createLink(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.media.createDocumentLink(id, this.ctx(user, meta));
  }

  /**
   * Serves a private document against a signed link.
   *
   * Public because the HMAC token *is* the authorisation: it was issued to a
   * permitted admin, covers exactly one object and expires in five minutes.
   */
  @Public()
  @Get('private')
  async servePrivate(
    @Query('key') key: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (this.config.storage.driver !== 'local') {
      throw new NotFoundException(
        'Private files are served by the storage provider in this configuration.',
      );
    }
    if (!key || !expires || !signature) {
      throw new BadRequestException('This link is incomplete.');
    }
    if (!this.localStorage.verifySignature(key, Number(expires), signature)) {
      throw new ForbiddenException('This download link is invalid or has expired.');
    }

    const file = await this.media.readPrivateObject(key);
    void reply
      .header('content-type', file.contentType)
      .header('content-disposition', `attachment; filename="${sanitiseFilename(file.filename)}"`)
      .header('cache-control', 'private, no-store')
      .header('x-content-type-options', 'nosniff')
      .send(file.data);
  }

  // ---- public file serving ------------------------------------------------

  /** Serves public media. Only the `public/` namespace is reachable here. */
  @Public()
  @Get('file/*')
  async serveFile(@Param('*') path: string, @Res() reply: FastifyReply): Promise<void> {
    const file = await this.media.readPublicObject(path);
    void reply
      .header('content-type', file.contentType)
      .header('cache-control', 'public, max-age=31536000, immutable')
      .header('x-content-type-options', 'nosniff')
      .send(file.data);
  }
}

/** Keeps a download filename free of quotes, slashes and control characters. */
function sanitiseFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._ -]/g, '_').slice(0, 120) || 'download';
}
