/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Body,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { listQuerySchema, statusChangeSchema } from '@kts/validation';
import type { Paginated, SessionUserDto } from '@kts/shared-types';
import { z, type ZodTypeAny } from 'zod';
import { CurrentUser, Meta, type RequestMeta } from '../http/request-context';
import type { CrudContext } from './crud.types';
import type { CrudService } from './crud.service';

const reorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });

/**
 * Route surface shared by every admin content resource.
 *
 * Subclasses declare `@Controller('admin/<resource>')` and provide the service
 * and the two Zod schemas. Permission checks live in the service, so they hold
 * whether the call arrives through this controller or anywhere else.
 */
export abstract class BaseCrudController<TDto> {
  protected abstract readonly service: CrudService<TDto>;
  protected abstract readonly createSchema: ZodTypeAny;
  protected abstract readonly updateSchema: ZodTypeAny;

  protected context(user: SessionUserDto, meta: RequestMeta): CrudContext {
    return { user, meta };
  }

  @Get()
  async list(
    @Query() rawQuery: Record<string, unknown>,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<Paginated<TDto>> {
    const query = listQuerySchema.passthrough().parse(rawQuery ?? {});
    return this.service.list(query as any, this.context(user, meta));
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    return this.service.findOne(id, this.context(user, meta));
  }

  @Get(':id/revisions')
  async revisions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.service.listRevisions(id, this.context(user, meta));
  }

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    const input = this.createSchema.parse(body ?? {});
    return this.service.create(input, this.context(user, meta));
  }

  @Post('reorder')
  @HttpCode(204)
  async reorder(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    const { ids } = reorderSchema.parse(body ?? {});
    await this.service.reorder(ids, this.context(user, meta));
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    const input = this.updateSchema.parse(body ?? {});
    return this.service.update(id, input, this.context(user, meta));
  }

  @Post(':id/status')
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    const input = statusChangeSchema.parse(body ?? {});
    return this.service.changeStatus(id, input as any, this.context(user, meta));
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    return this.service.duplicate(id, this.context(user, meta));
  }

  @Post(':id/restore')
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    return this.service.restore(id, this.context(user, meta));
  }

  @Post(':id/revisions/:version/restore')
  async restoreRevision(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<TDto> {
    return this.service.restoreRevision(id, version, this.context(user, meta));
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    await this.service.archive(id, this.context(user, meta));
  }
}
