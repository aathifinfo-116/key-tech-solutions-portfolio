/**
 * Admin API surface.
 *
 * Authentication is an HttpOnly session cookie set by the API, so every call
 * simply sends credentials; no token is ever stored in JavaScript.
 */

import type {
  AdminUserDto,
  FooterGroupDto,
  NavigationMenuDto,
  SitemapEntryDto,
  AuditLogDto,
  DashboardStatsDto,
  JobApplicationDto,
  LeadDto,
  MediaAssetDto,
  Paginated,
  PermissionDto,
  RedirectRuleDto,
  RevisionDto,
  RoleDto,
  SeoHealthDto,
  SessionUserDto,
} from '@kts/shared-types';
import { ApiClient, type RequestOptions } from './client';

const AUTH = '/api/v1/auth';
const ADMIN = '/api/v1/admin';
const MEDIA = '/api/v1/media';

export interface AdminListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  includeArchived?: boolean;
  [key: string]: string | number | boolean | undefined;
}

/** Content resources that share the generic CRUD surface. */
export type AdminResource =
  | 'pages'
  | 'services'
  | 'service-categories'
  | 'solutions'
  | 'industries'
  | 'products'
  | 'portfolio'
  | 'case-studies'
  | 'blog'
  | 'blog-categories'
  | 'blog-tags'
  | 'authors'
  | 'careers'
  | 'testimonials'
  | 'clients'
  | 'partners'
  | 'process-phases'
  | 'company-values'
  | 'milestones'
  | 'statistics'
  | 'technologies'
  | 'technology-categories'
  | 'team'
  | 'announcements'
  | 'navigation'
  | 'footer'
  | 'settings'
  | 'redirects';

export class AdminApi {
  constructor(private readonly client: ApiClient) {}

  private opts(extra: RequestOptions = {}): RequestOptions {
    return { credentials: 'include', cache: 'no-store', ...extra };
  }

  // ---- authentication -----------------------------------------------------

  login(body: {
    email: string;
    password: string;
    rememberDevice?: boolean;
  }): Promise<SessionUserDto> {
    return this.client.post(`${AUTH}/login`, body, this.opts());
  }

  logout(): Promise<void> {
    return this.client.post(`${AUTH}/logout`, undefined, this.opts());
  }

  me(): Promise<SessionUserDto> {
    return this.client.get(`${AUTH}/me`, this.opts());
  }

  forgotPassword(body: { email: string }): Promise<{ message: string }> {
    return this.client.post(`${AUTH}/forgot-password`, body, this.opts());
  }

  resetPassword(body: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return this.client.post(`${AUTH}/reset-password`, body, this.opts());
  }

  changePassword(body: {
    currentPassword: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return this.client.post(`${AUTH}/change-password`, body, this.opts());
  }

  sessions(): Promise<
    Array<{
      id: string;
      userAgent: string | null;
      ipAddress: string | null;
      createdAt: string;
      current: boolean;
    }>
  > {
    return this.client.get(`${AUTH}/sessions`, this.opts());
  }

  revokeSession(id: string): Promise<void> {
    return this.client.delete(`${AUTH}/sessions/${id}`, this.opts());
  }

  // ---- dashboard ----------------------------------------------------------

  dashboard(): Promise<DashboardStatsDto> {
    return this.client.get(`${ADMIN}/dashboard`, this.opts());
  }

  seoHealth(): Promise<SeoHealthDto> {
    return this.client.get(`${ADMIN}/seo/health`, this.opts());
  }

  /** Sitemap entries as the public site would emit them. */
  sitemapPreview(): Promise<SitemapEntryDto[]> {
    return this.client.get(`${ADMIN}/seo/sitemap`, this.opts());
  }

  /** Site settings, including ones withheld from the public API. */
  listSettings(): Promise<
    Array<{
      id: string;
      key: string;
      value: unknown;
      group: string;
      label: string;
      description: string | null;
      isPublic: boolean;
    }>
  > {
    return this.client.get(`${ADMIN}/settings`, this.opts());
  }

  upsertSetting(body: unknown): Promise<unknown> {
    return this.client.post(`${ADMIN}/settings`, body, this.opts());
  }

  navigation(location = 'PRIMARY'): Promise<NavigationMenuDto | null> {
    return this.client.getOrNull(`${ADMIN}/navigation`, this.opts({ query: { location } }));
  }

  saveNavigation(body: unknown): Promise<NavigationMenuDto> {
    return this.client.post(`${ADMIN}/navigation`, body, this.opts());
  }

  footer(): Promise<FooterGroupDto[]> {
    return this.client.get(`${ADMIN}/footer`, this.opts());
  }

  saveFooterGroup(body: unknown): Promise<FooterGroupDto[]> {
    return this.client.post(`${ADMIN}/footer`, body, this.opts());
  }

  announcements(): Promise<
    Array<{
      id: string;
      message: string;
      linkLabel: string | null;
      linkHref: string | null;
      tone: string;
      isActive: boolean;
      startsAt: string | null;
      endsAt: string | null;
      sortOrder: number;
    }>
  > {
    return this.client.get(`${ADMIN}/announcements`, this.opts());
  }

  createAnnouncement(body: unknown): Promise<unknown> {
    return this.client.post(`${ADMIN}/announcements`, body, this.opts());
  }

  updateAnnouncement(id: string, body: unknown): Promise<unknown> {
    return this.client.patch(`${ADMIN}/announcements/${id}`, body, this.opts());
  }

  deleteAnnouncement(id: string): Promise<void> {
    return this.client.delete(`${ADMIN}/announcements/${id}`, this.opts());
  }

  // ---- generic content CRUD ----------------------------------------------

  list<T>(resource: AdminResource, query: AdminListQuery = {}): Promise<Paginated<T>> {
    return this.client.list<T>(`${ADMIN}/${resource}`, this.opts({ query }));
  }

  get<T>(resource: AdminResource, id: string): Promise<T> {
    return this.client.get<T>(`${ADMIN}/${resource}/${id}`, this.opts());
  }

  create<T>(resource: AdminResource, body: unknown): Promise<T> {
    return this.client.post<T>(`${ADMIN}/${resource}`, body, this.opts());
  }

  update<T>(resource: AdminResource, id: string, body: unknown): Promise<T> {
    return this.client.patch<T>(`${ADMIN}/${resource}/${id}`, body, this.opts());
  }

  remove(resource: AdminResource, id: string): Promise<void> {
    return this.client.delete(`${ADMIN}/${resource}/${id}`, this.opts());
  }

  changeStatus<T>(
    resource: AdminResource,
    id: string,
    body: { status: string; scheduledAt?: string | null; changeSummary?: string },
  ): Promise<T> {
    return this.client.post<T>(`${ADMIN}/${resource}/${id}/status`, body, this.opts());
  }

  duplicate<T>(resource: AdminResource, id: string): Promise<T> {
    return this.client.post<T>(`${ADMIN}/${resource}/${id}/duplicate`, undefined, this.opts());
  }

  reorder(resource: AdminResource, ids: string[]): Promise<void> {
    return this.client.post(`${ADMIN}/${resource}/reorder`, { ids }, this.opts());
  }

  revisions(resource: AdminResource, id: string): Promise<RevisionDto[]> {
    return this.client.get(`${ADMIN}/${resource}/${id}/revisions`, this.opts());
  }

  restoreRevision<T>(resource: AdminResource, id: string, version: number): Promise<T> {
    return this.client.post<T>(
      `${ADMIN}/${resource}/${id}/revisions/${version}/restore`,
      undefined,
      this.opts(),
    );
  }

  // ---- media --------------------------------------------------------------

  media(query: AdminListQuery = {}): Promise<Paginated<MediaAssetDto>> {
    return this.client.list<MediaAssetDto>(`${MEDIA}/assets`, this.opts({ query }));
  }

  uploadImage(formData: FormData): Promise<MediaAssetDto> {
    return this.client.post(`${MEDIA}/upload`, undefined, this.opts({ formData }));
  }

  uploadDocument(formData: FormData): Promise<{ id: string; originalName: string }> {
    return this.client.post(`${MEDIA}/documents`, undefined, this.opts({ formData }));
  }

  updateMedia(id: string, body: unknown): Promise<MediaAssetDto> {
    return this.client.patch(`${MEDIA}/assets/${id}`, body, this.opts());
  }

  archiveMedia(id: string): Promise<void> {
    return this.client.delete(`${MEDIA}/assets/${id}`, this.opts());
  }

  /** Short-lived signed link for a private document. */
  documentDownloadLink(id: string): Promise<{ url: string; expiresAt: string }> {
    return this.client.post(`${MEDIA}/documents/${id}/link`, undefined, this.opts());
  }

  // ---- leads, applications ------------------------------------------------

  leads(query: AdminListQuery = {}): Promise<Paginated<LeadDto>> {
    return this.client.list<LeadDto>(`${ADMIN}/leads`, this.opts({ query }));
  }

  lead(id: string): Promise<LeadDto> {
    return this.client.get(`${ADMIN}/leads/${id}`, this.opts());
  }

  updateLead(id: string, body: unknown): Promise<LeadDto> {
    return this.client.patch(`${ADMIN}/leads/${id}`, body, this.opts());
  }

  addLeadNote(id: string, body: unknown): Promise<LeadDto> {
    return this.client.post(`${ADMIN}/leads/${id}/notes`, body, this.opts());
  }

  applications(query: AdminListQuery = {}): Promise<Paginated<JobApplicationDto>> {
    return this.client.list<JobApplicationDto>(`${ADMIN}/applications`, this.opts({ query }));
  }

  updateApplication(id: string, body: unknown): Promise<JobApplicationDto> {
    return this.client.patch(`${ADMIN}/applications/${id}`, body, this.opts());
  }

  /**
   * Requests a short-lived signed link to an applicant's CV.
   * The API checks the permission, issues a five-minute URL and audits it.
   */
  applicationCvLink(id: string): Promise<{ url: string; expiresAt: string }> {
    return this.client.post(`${ADMIN}/applications/${id}/cv-link`, undefined, this.opts());
  }

  // ---- users, roles, audit ------------------------------------------------

  users(query: AdminListQuery = {}): Promise<Paginated<AdminUserDto>> {
    return this.client.list<AdminUserDto>(`${ADMIN}/users`, this.opts({ query }));
  }

  createUser(body: unknown): Promise<AdminUserDto> {
    return this.client.post(`${ADMIN}/users`, body, this.opts());
  }

  updateUser(id: string, body: unknown): Promise<AdminUserDto> {
    return this.client.patch(`${ADMIN}/users/${id}`, body, this.opts());
  }

  roles(): Promise<RoleDto[]> {
    return this.client.get(`${ADMIN}/roles`, this.opts());
  }

  createRole(body: unknown): Promise<RoleDto> {
    return this.client.post(`${ADMIN}/roles`, body, this.opts());
  }

  updateRole(id: string, body: unknown): Promise<RoleDto> {
    return this.client.patch(`${ADMIN}/roles/${id}`, body, this.opts());
  }

  permissions(): Promise<PermissionDto[]> {
    return this.client.get(`${ADMIN}/permissions`, this.opts());
  }

  auditLogs(query: AdminListQuery = {}): Promise<Paginated<AuditLogDto>> {
    return this.client.list<AuditLogDto>(`${ADMIN}/audit-logs`, this.opts({ query }));
  }

  // ---- seo ----------------------------------------------------------------

  redirects(query: AdminListQuery = {}): Promise<Paginated<RedirectRuleDto>> {
    return this.client.list<RedirectRuleDto>(`${ADMIN}/redirects`, this.opts({ query }));
  }

  createRedirect(body: unknown): Promise<RedirectRuleDto> {
    return this.client.post(`${ADMIN}/redirects`, body, this.opts());
  }

  updateRedirect(id: string, body: unknown): Promise<RedirectRuleDto> {
    return this.client.patch(`${ADMIN}/redirects/${id}`, body, this.opts());
  }

  deleteRedirect(id: string): Promise<void> {
    return this.client.delete(`${ADMIN}/redirects/${id}`, this.opts());
  }

  brand(): Promise<unknown> {
    return this.client.get(`${ADMIN}/branding`, this.opts());
  }

  updateBrand(body: unknown): Promise<unknown> {
    return this.client.patch(`${ADMIN}/branding`, body, this.opts());
  }
}

export function createAdminApi(baseUrl: string, fetchImpl?: typeof fetch): AdminApi {
  return new AdminApi(new ApiClient({ baseUrl, credentials: 'include', fetchImpl }));
}
