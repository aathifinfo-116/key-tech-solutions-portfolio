/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import {
  contactFormSchema,
  jobApplicationSchema,
  newsletterSchema,
  quoteRequestSchema,
} from '@kts/validation';
import { Public, PublicForm } from '../../common/auth/auth.decorators';
import { SessionService } from '../../common/auth/session.service';
import { Meta, type RequestMeta } from '../../common/http/request-context';
import { AppConfig } from '../../config/app-config';
import { LeadsService } from '../leads/leads.service';
import { MediaService } from '../media/media.service';
import { SeoService } from '../seo/seo.service';
import { SettingsService } from '../settings/settings.service';
import { PublicService } from './public.service';

/**
 * The read/write surface the public website talks to.
 *
 * Every route is `@Public()`; none of them expose draft content, private
 * documents or admin data. Write routes are additionally rate limited and
 * carry anti-automation checks.
 */
@Public()
@Controller('api/v1/public')
export class PublicController {
  constructor(
    private readonly content: PublicService,
    private readonly settings: SettingsService,
    private readonly seo: SeoService,
    private readonly leads: LeadsService,
    private readonly media: MediaService,
    private readonly config: AppConfig,
  ) {}

  // ---- site configuration -------------------------------------------------

  @Get('settings')
  getSettings() {
    return this.settings.publicSettings();
  }

  @Get('navigation')
  getNavigation(@Query('location') location = 'PRIMARY') {
    return this.settings.navigation(location);
  }

  @Get('footer')
  getFooter() {
    return this.settings.footer();
  }

  // ---- pages --------------------------------------------------------------

  @Get('homepage')
  getHomepage() {
    return this.content.homepage();
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.content.page(slug);
  }

  // ---- offerings ----------------------------------------------------------

  @Get('services')
  listServices(@Query() query: any) {
    return this.content.services(query);
  }

  @Get('services/:slug')
  getService(@Param('slug') slug: string) {
    return this.content.service(slug);
  }

  @Get('solutions')
  listSolutions(@Query() query: any) {
    return this.content.solutions(query);
  }

  @Get('solutions/:slug')
  getSolution(@Param('slug') slug: string) {
    return this.content.solution(slug);
  }

  @Get('industries')
  listIndustries(@Query() query: any) {
    return this.content.industries(query);
  }

  @Get('industries/:slug')
  getIndustry(@Param('slug') slug: string) {
    return this.content.industry(slug);
  }

  @Get('products')
  listProducts(@Query() query: any) {
    return this.content.products(query);
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.content.product(slug);
  }

  // ---- portfolio ----------------------------------------------------------

  @Get('portfolio')
  listProjects(@Query() query: any) {
    return this.content.projects(query);
  }

  @Get('portfolio/:slug')
  getProject(@Param('slug') slug: string) {
    return this.content.project(slug);
  }

  @Get('case-studies')
  listCaseStudies(@Query() query: any) {
    return this.content.caseStudies(query);
  }

  @Get('case-studies/:slug')
  getCaseStudy(@Param('slug') slug: string) {
    return this.content.caseStudy(slug);
  }

  // ---- company ------------------------------------------------------------

  @Get('process')
  listProcess() {
    return this.content.processPhases();
  }

  @Get('technologies')
  listTechnologies() {
    return this.content.technologies();
  }

  @Get('team')
  listTeam() {
    return this.content.team();
  }

  @Get('values')
  listValues() {
    return this.content.values();
  }

  @Get('milestones')
  listMilestones() {
    return this.content.milestones();
  }

  @Get('statistics')
  listStatistics(@Query('group') group = 'home') {
    return this.content.statistics(group);
  }

  @Get('testimonials')
  listTestimonials() {
    return this.content.testimonials();
  }

  @Get('clients')
  listClients() {
    return this.content.clients();
  }

  // ---- blog ---------------------------------------------------------------

  @Get('blog')
  listPosts(@Query() query: any) {
    return this.content.posts(query);
  }

  @Get('blog/:slug')
  getPost(@Param('slug') slug: string) {
    return this.content.post(slug);
  }

  @Get('blog-categories')
  listBlogCategories() {
    return this.content.blogCategories();
  }

  // ---- careers ------------------------------------------------------------

  @Get('careers')
  listCareers() {
    return this.content.careers();
  }

  @Get('careers/:slug')
  getCareer(@Param('slug') slug: string) {
    return this.content.career(slug);
  }

  // ---- seo ----------------------------------------------------------------

  @Get('sitemap')
  getSitemap() {
    return this.seo.sitemap();
  }

  @Get('redirects/resolve')
  resolveRedirect(@Query('path') path: string) {
    if (!path) throw new BadRequestException('A path is required.');
    return this.seo.resolveRedirect(path);
  }

  /**
   * One answer for the website's middleware: the redirect rule for this path
   * if there is one, and whether the path is a detail URL with nothing
   * publicly visible behind it.
   */
  @Get('routes/resolve')
  resolveRoute(@Query('path') path: string) {
    if (!path) throw new BadRequestException('A path is required.');
    return this.seo.resolveRoute(path);
  }

  // ---- forms --------------------------------------------------------------

  @PublicForm()
  @Post('contact')
  @HttpCode(201)
  submitContact(@Body() body: unknown, @Meta() meta: RequestMeta) {
    return this.leads.submitContact(contactFormSchema.parse(body ?? {}), meta);
  }

  @PublicForm()
  @Post('quote-requests')
  @HttpCode(201)
  submitQuote(@Body() body: unknown, @Meta() meta: RequestMeta) {
    return this.leads.submitQuote(quoteRequestSchema.parse(body ?? {}), meta);
  }

  @PublicForm()
  @Post('newsletter')
  @HttpCode(201)
  subscribe(@Body() body: unknown, @Meta() meta: RequestMeta) {
    return this.leads.subscribe(newsletterSchema.parse(body ?? {}), meta);
  }

  @PublicForm()
  @Post('applications')
  @HttpCode(201)
  apply(@Body() body: unknown, @Meta() meta: RequestMeta) {
    return this.leads.submitApplication(jobApplicationSchema.parse(body ?? {}), meta);
  }

  /**
   * Attachment upload for public forms (CV or enquiry document).
   *
   * Lands in private storage with no public URL: the response is an opaque id
   * the visitor then submits with the form. Nothing here is ever served back
   * to an anonymous caller.
   */
  @PublicForm()
  @Post('uploads')
  @HttpCode(201)
  async uploadAttachment(@Req() request: FastifyRequest) {
    const part = await request.file({ limits: { files: 1 } });
    if (!part) throw new BadRequestException('No file was supplied.');

    const kindField = part.fields?.kind;
    const kind =
      kindField && 'value' in kindField && kindField.value === 'cv' ? 'CV' : 'LEAD_ATTACHMENT';

    return this.media.uploadDocument(
      { filename: part.filename, mimetype: part.mimetype, buffer: await part.toBuffer() },
      { folder: kind === 'CV' ? 'careers' : 'leads', kind, uploadedById: null },
    );
  }

  // ---- preview ------------------------------------------------------------

  /**
   * Draft preview. Requires the shared preview secret, which the website holds
   * server side and never exposes to the browser.
   */
  @Get('preview/:entityType/:idOrSlug')
  preview(
    @Param('entityType') entityType: string,
    @Param('idOrSlug') idOrSlug: string,
    @Headers('x-preview-secret') secret: string,
  ) {
    const expected = this.config.previewSecret;
    if (!expected) throw new ForbiddenException('Preview is not enabled on this environment.');
    if (!secret || !SessionService.safeEquals(secret, expected)) {
      throw new ForbiddenException('Invalid preview credentials.');
    }
    return this.content.preview(entityType, idOrSlug);
  }
}
