/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import type { AuthorDto, BlogCategoryDto, BlogPostDto } from '@kts/shared-types';
import { estimateReadingMinutes, sanitizeRichText, slugify } from '@kts/validation';
import { AuditService } from '../../common/audit/audit.service';
import { CrudService } from '../../common/crud/crud.service';
import type { CrudConfig, CrudContext, PrismaDelegate } from '../../common/crud/crud.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import { mapMedia, mapSeo, type MediaUrlResolver } from '../../common/utils/mappers';
import {
  optionalConnect,
  relationSet,
  replaceChildren,
  seoNestedWrite,
  toDateOrNull,
} from './content.helpers';
import { blogDetailInclude, blogSummaryInclude } from './content.includes';
import { mapBlogPost } from './content.mappers';

/**
 * Blog posts.
 *
 * Rich text is sanitised on write (embeds are allowed here, restricted to the
 * YouTube/Vimeo allow list), reading time is recalculated from the sanitised
 * body rather than trusted from the client, and tags are upserted by slug so
 * editors can type a new tag without a separate screen.
 */
@Injectable()
export class BlogPostAdminService extends CrudService<BlogPostDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'blog',
    singular: 'Blog post',
    entityType: 'BLOG_POST',
    permissionFamily: 'blog',
    searchFields: ['title', 'excerpt', 'slug'],
    sortFields: ['title', 'publishedAt', 'updatedAt', 'sortOrder'],
    defaultOrderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    include: blogDetailInclude,
    listInclude: blogSummaryInclude,
    publishable: true,
    sluggable: true,
    publicBasePath: '/blog',
    reorderable: false,
    hasSeo: true,
    archivable: true,
    featuredField: 'isFeatured',
    labelField: 'title',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.blogPost as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): BlogPostDto {
    return mapBlogPost(row, this.resolver);
  }

  protected override listWhere(query: any): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.postType) where.postType = query.postType;
    if (query.authorId) where.authorId = query.authorId;
    return where;
  }

  private common(input: any) {
    const contentHtml = input.contentHtml
      ? sanitizeRichText(input.contentHtml, { allowEmbeds: true })
      : null;
    return {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      contentHtml,
      postType: input.postType ?? 'ARTICLE',
      // Derived from the stored body so it can never be inflated by the client.
      readingMinutes: estimateReadingMinutes(contentHtml),
      isFeatured: input.isFeatured ?? false,
      status: input.status ?? 'DRAFT',
      scheduledAt: toDateOrNull(input.scheduledAt),
      contentUpdatedAt: new Date(),
      coverImage: optionalConnect(input.coverImageId),
      author: optionalConnect(input.authorId),
      category: optionalConnect(input.categoryId),
      blocks: replaceChildren(input.blocks, (block: any, i: number) => ({
        type: block.type,
        heading: block.heading ?? null,
        text: block.text ?? null,
        html: block.html ? sanitizeRichText(block.html, { allowEmbeds: true }) : null,
        code: block.code ?? null,
        language: block.language ?? null,
        items: block.items ?? undefined,
        mediaId: block.mediaId ?? null,
        href: block.href ?? null,
        linkLabel: block.linkLabel ?? null,
        settings: block.settings ?? undefined,
        sortOrder: block.sortOrder ?? i,
      })),
      relatedTo: relationSet(input.relatedPostIds),
      services: relationSet(input.serviceIds),
      products: relationSet(input.productIds),
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }

  /** Tags are upserted by slug, then attached; unused links are removed. */
  protected override async afterWrite(row: any, input: any, _ctx: CrudContext): Promise<any> {
    if (!input.tagSlugs) return row;

    const slugs = Array.from(
      new Set((input.tagSlugs as string[]).map((tag) => slugify(tag)).filter(Boolean)),
    );
    const tags = await Promise.all(
      slugs.map((slug, index) =>
        this.prisma.blogTag.upsert({
          where: { slug },
          create: { slug, name: (input.tagSlugs as string[])[index] ?? slug },
          update: {},
        }),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.blogPostTag.deleteMany({ where: { postId: row.id } }),
      ...(tags.length > 0
        ? [
            this.prisma.blogPostTag.createMany({
              data: tags.map((tag) => ({ postId: row.id, tagId: tag.id })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return this.delegate.findUnique({ where: { id: row.id }, include: this.config.include });
  }
}

// ---------------------------------------------------------------------------
// Categories and authors
// ---------------------------------------------------------------------------

@Injectable()
export class BlogCategoryAdminService extends CrudService<BlogCategoryDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'blog-categories',
    singular: 'Blog category',
    entityType: 'BLOG_CATEGORY',
    permissionFamily: 'blog',
    searchFields: ['name', 'slug'],
    sortFields: ['name', 'sortOrder'],
    defaultOrderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { seo: { include: { ogImage: true } }, _count: { select: { posts: true } } },
    publishable: false,
    sluggable: true,
    reorderable: true,
    hasSeo: true,
    archivable: false,
    labelField: 'name',
    snapshotOmit: ['seoId'],
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.blogCategory as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): BlogCategoryDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      accentColor: row.accentColor,
      postCount: row._count?.posts,
    };
  }

  private common(input: any) {
    return {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      accentColor: input.accentColor ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    };
  }

  protected toCreateData(input: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo) };
  }

  protected toUpdateData(input: any, existing: any) {
    return { ...this.common(input), seo: seoNestedWrite(input.seo, existing.seoId) };
  }

  /** Exposed for the public API, which does not carry an admin context. */
  async listPublic(): Promise<BlogCategoryDto[]> {
    const rows = await this.prisma.blogCategory.findMany({
      where: { isActive: true, posts: { some: { status: 'PUBLISHED', archivedAt: null } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { posts: { where: { status: 'PUBLISHED', archivedAt: null } } } },
      },
    });
    return rows.map((row) => this.toDto(row));
  }

  /** Unused for categories; kept for interface symmetry. */
  seoOf(row: any) {
    return mapSeo(row.seo, this.resolver);
  }
}

@Injectable()
export class AuthorAdminService extends CrudService<AuthorDto> {
  protected readonly delegate: PrismaDelegate;
  protected readonly resolver: MediaUrlResolver;
  protected readonly config: CrudConfig = {
    resource: 'authors',
    singular: 'Author',
    entityType: 'BLOG_POST',
    permissionFamily: 'blog',
    searchFields: ['displayName', 'slug', 'jobTitle'],
    sortFields: ['displayName'],
    defaultOrderBy: [{ displayName: 'asc' }],
    include: { avatar: true },
    publishable: false,
    sluggable: true,
    reorderable: false,
    hasSeo: false,
    archivable: false,
    labelField: 'displayName',
  };

  constructor(
    prisma: PrismaService,
    audit: AuditService,
    revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    super(prisma, audit, revalidation);
    this.delegate = prisma.author as unknown as PrismaDelegate;
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  protected toDto(row: any): AuthorDto {
    return {
      id: row.id,
      slug: row.slug,
      displayName: row.displayName,
      jobTitle: row.jobTitle,
      biography: row.biography,
      avatar: mapMedia(row.avatar, this.resolver),
      linkedinUrl: row.linkedinUrl,
      githubUrl: row.githubUrl,
      websiteUrl: row.websiteUrl,
    };
  }

  private common(input: any) {
    return {
      slug: input.slug,
      displayName: input.displayName,
      jobTitle: input.jobTitle ?? null,
      biography: input.biography ? sanitizeRichText(input.biography) : null,
      linkedinUrl: input.linkedinUrl ?? null,
      githubUrl: input.githubUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
      isActive: input.isActive ?? true,
      avatar: optionalConnect(input.avatarId),
      adminUser: optionalConnect(input.adminUserId),
    };
  }

  protected toCreateData(input: any) {
    return this.common(input);
  }

  protected toUpdateData(input: any) {
    return this.common(input);
  }
}
