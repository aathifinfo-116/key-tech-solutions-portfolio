/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LeadDto, Paginated, SubmissionReceiptDto } from '@kts/shared-types';
import {
  assessSpam,
  type ContactFormInput,
  type JobApplicationInput,
  type NewsletterInput,
  type QuoteRequestInput,
} from '@kts/validation';
import {
  leadNotificationEmail,
  submissionAcknowledgementEmail,
  applicationAcknowledgementEmail,
} from '@kts/email-templates';
import { AppConfig } from '../../config/app-config';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { mapDocument } from '../../common/utils/mappers';
import {
  buildSearchWhere,
  normalisePaging,
  paginate,
  toSkipTake,
} from '../../common/utils/pagination';
import type { CrudContext, CrudListQuery } from '../../common/crud/crud.types';
import type { RequestMeta } from '../../common/http/request-context';

/**
 * Contact messages, quote requests, newsletter sign-ups and job applications.
 *
 * Every public submission is persisted first and notified second, so a mail
 * outage can never lose an enquiry. Suspected spam is stored and flagged for a
 * human rather than discarded.
 */
@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: AppConfig,
  ) {}

  private assert(ctx: CrudContext, permission: string): void {
    if (!ctx.user.permissions.includes(permission)) {
      throw new ForbiddenException(
        `Your role does not include the required permission: ${permission}.`,
      );
    }
  }

  /** KTS-C-000123 style reference, unique per type and monotonically numbered. */
  private async nextReference(prefix: 'C' | 'Q' | 'A' | 'N'): Promise<string> {
    const count = await this.prisma.lead.count();
    return `KTS-${prefix}-${String(count + 1).padStart(6, '0')}`;
  }

  // -------------------------------------------------------------------------
  // Public submissions
  // -------------------------------------------------------------------------

  async submitContact(input: ContactFormInput, meta: RequestMeta): Promise<SubmissionReceiptDto> {
    const spam = assessSpam({
      message: input.message,
      subject: input.subject,
      honeypot: input.website,
      elapsedMs: input.elapsedMs,
      email: input.email,
    });

    const reference = await this.nextReference('C');

    const lead = await this.prisma.lead.create({
      data: {
        reference,
        type: 'CONTACT',
        leadStatus: spam.isSpam ? 'SPAM' : 'NEW',
        name: input.name,
        email: input.email,
        mobile: input.mobile ?? null,
        organization: input.organization ?? null,
        subject: input.subject,
        message: input.message,
        serviceInterest: input.serviceInterest ?? null,
        attachmentId: input.attachmentId ?? null,
        consentGiven: input.consent,
        consentText: 'Consented to being contacted about this enquiry.',
        sourcePage: input.sourcePage ?? null,
        sourceIp: meta.ipAddress,
        userAgent: meta.userAgent,
        spamScore: spam.score,
        contact: {
          create: {
            serviceInterest: input.serviceInterest ?? null,
            subject: input.subject,
            message: input.message,
          },
        },
      },
    });

    await this.audit.record({
      action: 'CREATE',
      entityType: 'LEAD',
      entityId: lead.id,
      entityLabel: reference,
      summary: spam.isSpam
        ? `Flagged as spam (${spam.reasons.join(', ')})`
        : 'Contact message received',
      meta,
    });

    if (!spam.isSpam) await this.notify(lead, 'Contact message', input.message);

    return {
      reference,
      receivedAt: lead.createdAt.toISOString(),
      message: 'Thank you. Your message has been received and we will reply by email.',
    };
  }

  async submitQuote(input: QuoteRequestInput, meta: RequestMeta): Promise<SubmissionReceiptDto> {
    const spam = assessSpam({
      message: input.businessChallenge,
      honeypot: input.website,
      elapsedMs: input.elapsedMs,
      email: input.email,
    });

    const reference = await this.nextReference('Q');

    const lead = await this.prisma.lead.create({
      data: {
        reference,
        type: 'QUOTE',
        leadStatus: spam.isSpam ? 'SPAM' : 'NEW',
        name: input.name,
        email: input.email,
        mobile: input.mobile ?? null,
        organization: input.organization,
        subject: `Quote request: ${input.projectType}`,
        message: input.businessChallenge,
        attachmentId: input.attachmentId ?? null,
        consentGiven: input.consent,
        consentText: 'Consented to being contacted about this quote request.',
        sourcePage: input.sourcePage ?? null,
        sourceIp: meta.ipAddress,
        userAgent: meta.userAgent,
        spamScore: spam.score,
        quoteRequest: {
          create: {
            projectType: input.projectType,
            businessChallenge: input.businessChallenge,
            requiredFeatures: input.requiredFeatures ?? [],
            existingSystem: input.existingSystem ?? null,
            budgetRange: input.budgetRange ?? null,
            preferredStart: input.preferredStart ?? null,
            timelineNote: input.timelineNote ?? null,
          },
        },
      },
    });

    await this.audit.record({
      action: 'CREATE',
      entityType: 'LEAD',
      entityId: lead.id,
      entityLabel: reference,
      summary: spam.isSpam
        ? `Flagged as spam (${spam.reasons.join(', ')})`
        : `Quote request: ${input.projectType}`,
      meta,
    });

    if (!spam.isSpam) await this.notify(lead, 'Quote request', input.businessChallenge);

    return {
      reference,
      receivedAt: lead.createdAt.toISOString(),
      message: 'Thank you. Your quote request has been received and we will be in touch.',
    };
  }

  async subscribe(input: NewsletterInput, meta: RequestMeta): Promise<SubmissionReceiptDto> {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: input.email },
    });

    // Re-subscribing simply clears the unsubscribe timestamp; the response is
    // identical either way so the endpoint cannot confirm who is on the list.
    const subscriber = existing
      ? await this.prisma.newsletterSubscriber.update({
          where: { email: input.email },
          data: { unsubscribedAt: null, name: input.name ?? existing.name },
        })
      : await this.prisma.newsletterSubscriber.create({
          data: {
            email: input.email,
            name: input.name ?? null,
            sourcePage: input.sourcePage ?? null,
            sourceIp: meta.ipAddress,
          },
        });

    return {
      reference: subscriber.id,
      receivedAt: subscriber.createdAt.toISOString(),
      message: 'Thank you for subscribing.',
    };
  }

  async submitApplication(
    input: JobApplicationInput,
    meta: RequestMeta,
  ): Promise<SubmissionReceiptDto> {
    const career = await this.prisma.career.findUnique({ where: { slug: input.careerSlug } });
    if (!career || career.careerStatus !== 'OPEN') {
      throw new NotFoundException('That role is not currently accepting applications.');
    }
    if (career.applyDeadline && career.applyDeadline < new Date()) {
      throw new BadRequestException('The deadline for this role has passed.');
    }

    const count = await this.prisma.jobApplication.count();
    const reference = `KTS-A-${String(count + 1).padStart(6, '0')}`;

    const application = await this.prisma.jobApplication.create({
      data: {
        careerId: career.id,
        applicantName: input.applicantName,
        email: input.email,
        mobile: input.mobile ?? null,
        portfolioUrl: input.portfolioUrl ?? null,
        linkedinUrl: input.linkedinUrl ?? null,
        coverNote: input.coverNote ?? null,
        cvDocumentId: input.cvDocumentId ?? null,
        consentGiven: input.consent,
        consentText: 'Consented to Key Tech Solutions processing this application.',
        sourceIp: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    await this.audit.record({
      action: 'CREATE',
      entityType: 'JOB_APPLICATION',
      entityId: application.id,
      entityLabel: reference,
      summary: `Application for ${career.title}`,
      meta,
    });

    await this.mail.send(
      applicationAcknowledgementEmail(this.brand(), {
        name: input.applicantName,
        roleTitle: career.title,
        reference,
      }),
      { to: input.email },
    );

    return {
      reference,
      receivedAt: application.appliedAt.toISOString(),
      message: 'Thank you. Your application has been received.',
    };
  }

  private brand() {
    return {
      companyName: 'Key Tech Solutions',
      siteUrl: this.config.publicSiteUrl,
      supportEmail: this.config.mail.notifyTo || null,
    };
  }

  /** Internal notification plus applicant acknowledgement. Never throws. */
  private async notify(
    lead: {
      id: string;
      reference: string;
      name: string;
      email: string;
      organization: string | null;
      subject: string | null;
    },
    kind: 'Contact message' | 'Quote request',
    summary: string,
  ): Promise<void> {
    const notifyTo = this.mail.notifyAddress;
    if (notifyTo) {
      await this.mail.send(
        leadNotificationEmail(this.brand(), {
          reference: lead.reference,
          type: kind,
          name: lead.name,
          email: lead.email,
          organization: lead.organization,
          subject: lead.subject,
          summary,
          adminUrl: `${this.config.adminSiteUrl}/growth/leads/${lead.id}`,
        }),
        { to: notifyTo, replyTo: lead.email },
      );
    }

    await this.mail.send(
      submissionAcknowledgementEmail(this.brand(), {
        name: lead.name,
        reference: lead.reference,
        kind: kind === 'Quote request' ? 'quote request' : 'message',
      }),
      { to: lead.email },
    );
  }

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  async list(query: CrudListQuery, ctx: CrudContext): Promise<Paginated<LeadDto>> {
    this.assert(ctx, 'leads:read');
    const paging = normalisePaging(query);
    const { skip, take } = toSkipTake(paging);

    const where: Record<string, unknown> = {};
    if (query.leadStatus) where.leadStatus = query.leadStatus;
    if (query.type) where.type = query.type;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (!query.includeArchived) where.archivedAt = null;
    const search = buildSearchWhere(query.search, [
      'name',
      'email',
      'organization',
      'subject',
      'reference',
    ]);
    if (search) Object.assign(where, search);

    const [rows, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          assignedTo: { select: { id: true, name: true } },
          attachment: true,
          quoteRequest: true,
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: { author: { select: { name: true } } },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return paginate(rows.map(mapLead), paging, total);
  }

  async get(id: string, ctx: CrudContext): Promise<LeadDto> {
    this.assert(ctx, 'leads:read');
    const row = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        attachment: true,
        quoteRequest: true,
        notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      },
    });
    if (!row) throw new NotFoundException('That lead does not exist.');
    return mapLead(row);
  }

  async update(
    id: string,
    input: { leadStatus?: LeadDto['leadStatus']; assignedToId?: string | null },
    ctx: CrudContext,
  ): Promise<LeadDto> {
    this.assert(ctx, 'leads:update');
    const existing = await this.prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('That lead does not exist.');

    await this.prisma.lead.update({
      where: { id },
      data: {
        leadStatus: input.leadStatus,
        assignedToId: input.assignedToId,
        archivedAt: input.leadStatus === 'ARCHIVED' ? new Date() : null,
      },
    });

    await this.audit.record({
      action: 'STATUS_CHANGE',
      entityType: 'LEAD',
      entityId: id,
      entityLabel: existing.reference,
      summary: input.leadStatus
        ? `${existing.leadStatus} -> ${input.leadStatus}`
        : 'Assignment changed',
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    return this.get(id, ctx);
  }

  async addNote(
    id: string,
    input: { body: string; channel?: string; isInternal?: boolean },
    ctx: CrudContext,
  ): Promise<LeadDto> {
    this.assert(ctx, 'leads:update');
    await this.prisma.leadNote.create({
      data: {
        leadId: id,
        authorId: ctx.user.id,
        body: input.body,
        channel: input.channel ?? null,
        isInternal: input.isInternal ?? true,
      },
    });
    await this.audit.record({
      action: 'UPDATE',
      entityType: 'LEAD',
      entityId: id,
      summary: 'Note added',
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });
    return this.get(id, ctx);
  }

  /** CSV export. Gated behind `leads:export` and always audited. */
  async exportCsv(query: CrudListQuery, ctx: CrudContext): Promise<string> {
    this.assert(ctx, 'leads:export');

    const rows = await this.prisma.lead.findMany({
      where: {
        archivedAt: null,
        ...(query.leadStatus ? { leadStatus: query.leadStatus as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: { quoteRequest: true },
    });

    await this.audit.record({
      action: 'EXPORT',
      entityType: 'LEAD',
      summary: `Exported ${rows.length} lead(s)`,
      actor: { id: ctx.user.id, email: ctx.user.email },
      meta: ctx.meta,
    });

    const header = [
      'reference',
      'type',
      'status',
      'name',
      'email',
      'mobile',
      'organization',
      'subject',
      'projectType',
      'budgetRange',
      'createdAt',
    ];
    const lines = rows.map((row) =>
      [
        row.reference,
        row.type,
        row.leadStatus,
        row.name,
        row.email,
        row.mobile ?? '',
        row.organization ?? '',
        row.subject ?? '',
        row.quoteRequest?.projectType ?? '',
        row.quoteRequest?.budgetRange ?? '',
        row.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(','),
    );
    return [header.join(','), ...lines].join('\n');
  }
}

/**
 * Escapes a CSV cell and neutralises formula injection: a leading =, +, - or @
 * would otherwise execute when the file is opened in a spreadsheet.
 */
function csvCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function mapLead(row: any): LeadDto {
  return {
    id: row.id,
    reference: row.reference,
    type: row.type,
    leadStatus: row.leadStatus,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    organization: row.organization,
    subject: row.subject,
    message: row.message,
    serviceInterest: row.serviceInterest,
    assignedTo: row.assignedTo ? { id: row.assignedTo.id, name: row.assignedTo.name } : null,
    attachment: mapDocument(row.attachment),
    sourcePage: row.sourcePage,
    spamScore: row.spamScore,
    quote: row.quoteRequest
      ? {
          projectType: row.quoteRequest.projectType,
          businessChallenge: row.quoteRequest.businessChallenge,
          requiredFeatures: row.quoteRequest.requiredFeatures,
          existingSystem: row.quoteRequest.existingSystem,
          budgetRange: row.quoteRequest.budgetRange,
          preferredStart: row.quoteRequest.preferredStart,
          timelineNote: row.quoteRequest.timelineNote,
        }
      : null,
    notes: (row.notes ?? []).map((note: any) => ({
      id: note.id,
      body: note.body,
      channel: note.channel,
      isInternal: note.isInternal,
      authorName: note.author?.name ?? null,
      createdAt: note.createdAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
