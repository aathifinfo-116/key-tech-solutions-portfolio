/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type {
  AnnouncementDto,
  BrandDto,
  FooterGroupDto,
  NavigationItemDto,
  NavigationMenuDto,
  SiteSettingsDto,
  SocialLinkDto,
} from '@kts/shared-types';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { STORAGE_PROVIDER, type StorageProvider } from '../../common/storage/storage.interface';
import { mapMedia, type MediaUrlResolver } from '../../common/utils/mappers';
import type { CrudContext } from '../../common/crud/crud.types';

/**
 * Global site configuration: brand, settings, navigation, footer, announcements.
 *
 * Everything here is exposed publicly through a single `/settings` read, which
 * is what lets the header, footer and theme be edited without a deploy.
 * Settings marked `isPublic: false` are withheld from that response.
 */
@Injectable()
export class SettingsService {
  private readonly resolver: MediaUrlResolver;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    this.resolver = { publicUrl: (key: string) => this.storage.publicUrl(key) };
  }

  private assert(ctx: CrudContext, permission: string): void {
    if (!ctx.user.permissions.includes(permission)) {
      throw new ForbiddenException(
        `Your role does not include the required permission: ${permission}.`,
      );
    }
  }

  // ---- public read --------------------------------------------------------

  async publicSettings(): Promise<SiteSettingsDto> {
    const [brand, socialLinks, settings, announcement] = await Promise.all([
      this.prisma.brandSetting.findFirst({
        where: { singleton: true },
        include: {
          logoLight: true,
          logoDark: true,
          logoMark: true,
          favicon: true,
          ogDefault: true,
        },
      }),
      this.prisma.socialLink.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.siteSetting.findMany({ where: { isPublic: true } }),
      this.currentAnnouncement(),
    ]);

    return {
      brand: this.mapBrand(brand),
      socialLinks: socialLinks.map(mapSocial),
      settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
      announcement,
    };
  }

  /** The highest-priority announcement whose window includes right now. */
  async currentAnnouncement(now = new Date()): Promise<AnnouncementDto | null> {
    const row = await this.prisma.announcement.findFirst({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    if (!row) return null;
    return {
      id: row.id,
      message: row.message,
      linkLabel: row.linkLabel,
      linkHref: row.linkHref,
      tone: row.tone,
    };
  }

  private mapBrand(row: any): BrandDto {
    // Falls back to the documented Key Tech palette when nothing is stored yet.
    return {
      companyName: row?.companyName ?? 'Key Tech Solutions',
      shortName: row?.shortName ?? 'Key Tech',
      legalName: row?.legalName ?? null,
      tagline: row?.tagline ?? null,
      description: row?.description ?? null,
      colors: {
        primary: row?.primaryColor ?? '#6436A3',
        secondary: row?.secondaryColor ?? '#416F9E',
        accent: row?.accentColor ?? '#2CA3A3',
        highlight: row?.highlightColor ?? '#5BC3C6',
        ink: row?.inkColor ?? '#111426',
      },
      gradientCss:
        row?.gradientCss ?? 'linear-gradient(135deg, #6436A3 0%, #416F9E 50%, #2CA3A3 100%)',
      contactEmail: row?.contactEmail ?? null,
      contactPhone: row?.contactPhone ?? null,
      supportEmail: row?.supportEmail ?? null,
      logoLight: mapMedia(row?.logoLight, this.resolver),
      logoDark: mapMedia(row?.logoDark, this.resolver),
      logoMark: mapMedia(row?.logoMark, this.resolver),
      favicon: mapMedia(row?.favicon, this.resolver),
      ogDefault: mapMedia(row?.ogDefault, this.resolver),
    };
  }

  async navigation(location = 'PRIMARY'): Promise<NavigationMenuDto | null> {
    const menu = await this.prisma.navigationMenu.findFirst({
      where: { location: location as any, isActive: true },
      include: {
        items: {
          where: { isActive: true, parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!menu) return null;
    return {
      key: menu.key,
      name: menu.name,
      location: menu.location,
      items: menu.items.map(mapNavItem),
    };
  }

  async footer(): Promise<FooterGroupDto[]> {
    const groups = await this.prisma.footerGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { links: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    return groups.map((group) => ({
      key: group.key,
      title: group.title,
      links: group.links.map((link) => ({
        label: link.label,
        href: link.href,
        isExternal: link.isExternal,
      })),
    }));
  }

  // ---- admin writes -------------------------------------------------------

  async updateBrand(input: any, ctx: CrudContext): Promise<BrandDto> {
    this.assert(ctx, 'branding:update');

    const existing = await this.prisma.brandSetting.findFirst({ where: { singleton: true } });
    const data = {
      companyName: input.companyName,
      shortName: input.shortName,
      legalName: input.legalName ?? null,
      tagline: input.tagline ?? null,
      description: input.description ?? null,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
      highlightColor: input.highlightColor,
      inkColor: input.inkColor,
      gradientCss: input.gradientCss,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      supportEmail: input.supportEmail ?? null,
      logoLightId: input.logoLightId ?? null,
      logoDarkId: input.logoDarkId ?? null,
      logoMarkId: input.logoMarkId ?? null,
      faviconId: input.faviconId ?? null,
      ogDefaultId: input.ogDefaultId ?? null,
    };

    const row = existing
      ? await this.prisma.brandSetting.update({
          where: { id: existing.id },
          data,
          include: {
            logoLight: true,
            logoDark: true,
            logoMark: true,
            favicon: true,
            ogDefault: true,
          },
        })
      : await this.prisma.brandSetting.create({
          data: { ...data, singleton: true },
          include: {
            logoLight: true,
            logoDark: true,
            logoMark: true,
            favicon: true,
            ogDefault: true,
          },
        });

    await this.audit.record({
      action: 'UPDATE',
      entityType: 'BRAND_SETTING',
      entityId: row.id,
      entityLabel: row.companyName,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('BRAND_SETTING');

    return this.mapBrand(row);
  }

  async listSettings(ctx: CrudContext) {
    this.assert(ctx, 'settings:read');
    const rows = await this.prisma.siteSetting.findMany({
      orderBy: [{ group: 'asc' }, { label: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      group: row.group,
      label: row.label,
      description: row.description,
      isPublic: row.isPublic,
    }));
  }

  async upsertSetting(input: any, ctx: CrudContext) {
    this.assert(ctx, 'settings:update');
    const row = await this.prisma.siteSetting.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        value: input.value as any,
        group: input.group ?? 'general',
        label: input.label,
        description: input.description ?? null,
        isPublic: input.isPublic ?? true,
      },
      update: {
        value: input.value as any,
        group: input.group,
        label: input.label,
        description: input.description ?? null,
        isPublic: input.isPublic,
      },
    });

    await this.audit.record({
      action: 'UPDATE',
      entityType: 'SITE_SETTING',
      entityId: row.id,
      entityLabel: row.key,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('SITE_SETTING');
    return row;
  }

  /** Replaces a menu's items in one transaction so ordering stays consistent. */
  async saveNavigation(input: any, ctx: CrudContext): Promise<NavigationMenuDto> {
    this.assert(ctx, 'navigation:update');

    const menu = await this.prisma.navigationMenu.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        name: input.name,
        location: input.location,
        isActive: input.isActive ?? true,
      },
      update: { name: input.name, location: input.location, isActive: input.isActive ?? true },
    });

    await this.prisma.navigationItem.deleteMany({ where: { menuId: menu.id } });

    for (const [index, item] of (input.items ?? []).entries()) {
      const parent = await this.prisma.navigationItem.create({
        data: {
          menuId: menu.id,
          label: item.label,
          href: item.href,
          description: item.description ?? null,
          iconName: item.iconName ?? null,
          isExternal: item.isExternal ?? false,
          openInNewTab: item.openInNewTab ?? false,
          highlight: item.highlight ?? false,
          sortOrder: item.sortOrder ?? index,
          isActive: item.isActive ?? true,
        },
      });

      for (const [childIndex, child] of (item.children ?? []).entries()) {
        await this.prisma.navigationItem.create({
          data: {
            menuId: menu.id,
            parentId: parent.id,
            label: child.label,
            href: child.href,
            description: child.description ?? null,
            iconName: child.iconName ?? null,
            isExternal: child.isExternal ?? false,
            openInNewTab: child.openInNewTab ?? false,
            highlight: child.highlight ?? false,
            sortOrder: child.sortOrder ?? childIndex,
            isActive: child.isActive ?? true,
          },
        });
      }
    }

    await this.audit.record({
      action: 'UPDATE',
      entityType: 'NAVIGATION_MENU',
      entityId: menu.id,
      entityLabel: menu.name,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('NAVIGATION_MENU');

    return (await this.navigation(menu.location)) as NavigationMenuDto;
  }

  async saveFooterGroup(input: any, ctx: CrudContext): Promise<FooterGroupDto[]> {
    this.assert(ctx, 'navigation:update');

    const group = await this.prisma.footerGroup.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        title: input.title,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
      update: { title: input.title, sortOrder: input.sortOrder, isActive: input.isActive },
    });

    await this.prisma.footerLink.deleteMany({ where: { groupId: group.id } });
    if ((input.links ?? []).length > 0) {
      await this.prisma.footerLink.createMany({
        data: input.links.map((link: any, index: number) => ({
          groupId: group.id,
          label: link.label,
          href: link.href,
          isExternal: link.isExternal ?? false,
          sortOrder: link.sortOrder ?? index,
          isActive: link.isActive ?? true,
        })),
      });
    }

    await this.audit.record({
      action: 'UPDATE',
      entityType: 'FOOTER_GROUP',
      entityId: group.id,
      entityLabel: group.title,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('FOOTER_GROUP');

    return this.footer();
  }

  async listAnnouncements(ctx: CrudContext) {
    this.assert(ctx, 'settings:read');
    return this.prisma.announcement.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async saveAnnouncement(input: any, ctx: CrudContext, id?: string) {
    this.assert(ctx, 'settings:update');
    const data = {
      message: input.message,
      linkLabel: input.linkLabel ?? null,
      linkHref: input.linkHref ?? null,
      tone: input.tone ?? 'BRAND',
      isActive: input.isActive ?? false,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      sortOrder: input.sortOrder ?? 0,
    };

    const row = id
      ? await this.prisma.announcement.update({ where: { id }, data })
      : await this.prisma.announcement.create({ data });

    await this.audit.record({
      action: id ? 'UPDATE' : 'CREATE',
      entityType: 'ANNOUNCEMENT',
      entityId: row.id,
      entityLabel: row.message.slice(0, 80),
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('ANNOUNCEMENT');
    return row;
  }

  async deleteAnnouncement(id: string, ctx: CrudContext): Promise<void> {
    this.assert(ctx, 'settings:update');
    await this.prisma.announcement.delete({ where: { id } });
    await this.audit.record({
      action: 'DELETE',
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    await this.revalidation.revalidate('ANNOUNCEMENT');
  }
}

function mapSocial(row: any): SocialLinkDto {
  return { platform: row.platform, label: row.label, url: row.url, iconName: row.iconName };
}

function mapNavItem(row: any): NavigationItemDto {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    description: row.description,
    iconName: row.iconName,
    isExternal: row.isExternal,
    openInNewTab: row.openInNewTab,
    highlight: row.highlight,
    children: (row.children ?? []).map(mapNavItem),
  };
}
