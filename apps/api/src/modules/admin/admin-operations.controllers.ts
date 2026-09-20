/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin controllers for the modules that do not fit the generic CRUD surface:
 * leads, job openings and applications, site configuration, SEO and the
 * dashboard.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  announcementSchema,
  applicationUpdateSchema,
  brandSettingSchema,
  careerSchema,
  footerGroupSchema,
  leadNoteSchema,
  leadUpdateSchema,
  listQuerySchema,
  navigationMenuSchema,
  redirectRuleSchema,
  siteSettingSchema,
} from '@kts/validation';
import type { SessionUserDto } from '@kts/shared-types';
import { z } from 'zod';
import { RequirePermissions } from '../../common/auth/auth.decorators';
import { BaseCrudController } from '../../common/crud/crud.controller';
import { CurrentUser, Meta, type RequestMeta } from '../../common/http/request-context';
import { CareerAdminService, JobApplicationService } from '../careers/careers.service';
import { LeadsService } from '../leads/leads.service';
import { MediaService } from '../media/media.service';
import { SeoService } from '../seo/seo.service';
import { SettingsService } from '../settings/settings.service';
import { DashboardService } from './dashboard.service';

const careerStatusSchema = z.object({
  careerStatus: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']),
});

function ctx(user: SessionUserDto, meta: RequestMeta) {
  return { user, meta };
}

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------

@Controller('api/v1/admin/careers')
export class AdminCareersController extends BaseCrudController<unknown> {
  protected readonly createSchema = careerSchema;
  protected readonly updateSchema = careerSchema;

  constructor(protected readonly service: CareerAdminService) {
    super();
  }

  /** Careers use their own lifecycle rather than the content workflow. */
  @Post(':id/career-status')
  setCareerStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    const { careerStatus } = careerStatusSchema.parse(body ?? {});
    return this.service.setCareerStatus(id, careerStatus, ctx(user, meta));
  }
}

@Controller('api/v1/admin/applications')
export class AdminApplicationsController {
  constructor(
    private readonly applications: JobApplicationService,
    private readonly media: MediaService,
  ) {}

  @Get()
  @RequirePermissions('applications:read')
  list(@Query() query: any, @CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.applications.list(
      listQuerySchema.passthrough().parse(query ?? {}),
      ctx(user, meta),
    );
  }

  @Get(':id')
  @RequirePermissions('applications:read')
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.applications.get(id, ctx(user, meta));
  }

  @Patch(':id')
  @RequirePermissions('applications:update')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.applications.update(
      id,
      applicationUpdateSchema.parse(body ?? {}) as any,
      ctx(user, meta),
    );
  }

  /** Issues a short-lived signed link to the applicant's CV. Audited. */
  @Post(':id/cv-link')
  @RequirePermissions('applications:download')
  async cvLink(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    const documentId = await this.applications.cvDocumentId(id, ctx(user, meta));
    return this.media.createDocumentLink(documentId, ctx(user, meta));
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

@Controller('api/v1/admin/leads')
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermissions('leads:read')
  list(@Query() query: any, @CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.leads.list(listQuerySchema.passthrough().parse(query ?? {}), ctx(user, meta));
  }

  @Get('export')
  @RequirePermissions('leads:export')
  @Header('content-type', 'text/csv; charset=utf-8')
  @Header('content-disposition', 'attachment; filename="key-tech-leads.csv"')
  export(@Query() query: any, @CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.leads.exportCsv(listQuerySchema.passthrough().parse(query ?? {}), ctx(user, meta));
  }

  @Get(':id')
  @RequirePermissions('leads:read')
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.leads.get(id, ctx(user, meta));
  }

  @Patch(':id')
  @RequirePermissions('leads:update')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.leads.update(id, leadUpdateSchema.parse(body ?? {}) as any, ctx(user, meta));
  }

  @Post(':id/notes')
  @RequirePermissions('leads:update')
  addNote(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.leads.addNote(id, leadNoteSchema.parse(body ?? {}), ctx(user, meta));
  }
}

// ---------------------------------------------------------------------------
// Site configuration
// ---------------------------------------------------------------------------

@Controller('api/v1/admin')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('branding')
  @RequirePermissions('branding:read')
  getBrand() {
    return this.settings.publicSettings().then((settings) => settings.brand);
  }

  @Patch('branding')
  @RequirePermissions('branding:update')
  updateBrand(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.settings.updateBrand(brandSettingSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Get('settings')
  @RequirePermissions('settings:read')
  listSettings(@CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.settings.listSettings(ctx(user, meta));
  }

  @Post('settings')
  @RequirePermissions('settings:update')
  upsertSetting(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.settings.upsertSetting(siteSettingSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Get('navigation')
  @RequirePermissions('navigation:read')
  getNavigation(@Query('location') location = 'PRIMARY') {
    return this.settings.navigation(location);
  }

  @Post('navigation')
  @RequirePermissions('navigation:update')
  saveNavigation(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.settings.saveNavigation(navigationMenuSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Get('footer')
  @RequirePermissions('navigation:read')
  getFooter() {
    return this.settings.footer();
  }

  @Post('footer')
  @RequirePermissions('navigation:update')
  saveFooter(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.settings.saveFooterGroup(footerGroupSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Get('announcements')
  @RequirePermissions('settings:read')
  listAnnouncements(@CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.settings.listAnnouncements(ctx(user, meta));
  }

  @Post('announcements')
  @RequirePermissions('settings:update')
  createAnnouncement(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.settings.saveAnnouncement(announcementSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Patch('announcements/:id')
  @RequirePermissions('settings:update')
  updateAnnouncement(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.settings.saveAnnouncement(
      announcementSchema.parse(body ?? {}),
      ctx(user, meta),
      id,
    );
  }

  @Delete('announcements/:id')
  @HttpCode(204)
  @RequirePermissions('settings:update')
  async deleteAnnouncement(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    await this.settings.deleteAnnouncement(id, ctx(user, meta));
  }
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

@Controller('api/v1/admin')
export class AdminSeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('seo/health')
  @RequirePermissions('seo:read')
  health(@CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.seo.health(ctx(user, meta));
  }

  @Get('seo/sitemap')
  @RequirePermissions('sitemap:read')
  sitemap() {
    return this.seo.sitemap();
  }

  @Get('redirects')
  @RequirePermissions('redirects:read')
  listRedirects(
    @Query() query: any,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.seo.listRedirects(
      listQuerySchema.passthrough().parse(query ?? {}),
      ctx(user, meta),
    );
  }

  @Post('redirects')
  @RequirePermissions('redirects:create')
  createRedirect(
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.seo.createRedirect(redirectRuleSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Patch('redirects/:id')
  @RequirePermissions('redirects:update')
  updateRedirect(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ) {
    return this.seo.updateRedirect(id, redirectRuleSchema.parse(body ?? {}), ctx(user, meta));
  }

  @Delete('redirects/:id')
  @HttpCode(204)
  @RequirePermissions('redirects:delete')
  async deleteRedirect(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: SessionUserDto,
    @Meta() meta: RequestMeta,
  ): Promise<void> {
    await this.seo.deleteRedirect(id, ctx(user, meta));
  }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

@Controller('api/v1/admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @RequirePermissions('dashboard:read')
  stats(@CurrentUser() user: SessionUserDto, @Meta() meta: RequestMeta) {
    return this.dashboard.stats(ctx(user, meta));
  }
}

export const ADMIN_OPERATION_CONTROLLERS = [
  AdminCareersController,
  AdminApplicationsController,
  AdminLeadsController,
  AdminSettingsController,
  AdminSeoController,
  AdminDashboardController,
];
